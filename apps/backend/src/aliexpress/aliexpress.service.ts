import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AliExpressService {
  private readonly logger = new Logger(AliExpressService.name);
  private readonly apiGateway = 'https://api-sg.aliexpress.com';
  private readonly authUrl = 'https://api-sg.aliexpress.com/oauth/authorize';

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private get appKey(): string {
    return this.config.get<string>('ALIEXPRESS_APP_KEY', '');
  }

  private get appSecret(): string {
    return this.config.get<string>('ALIEXPRESS_APP_SECRET', '');
  }

  private get callbackUrl(): string {
    return this.config.get<string>('ALIEXPRESS_CALLBACK_URL', 'http://localhost:4000/aliexpress/callback');
  }

  private get markupMultiplier(): number {
    return parseFloat(this.config.get<string>('DROPSHIP_MARKUP', '1.5'));
  }

  private get platformFeePercent(): number {
    return parseFloat(this.config.get<string>('PLATFORM_FEE_PERCENT', '2.5'));
  }

  // Generate MD5 signature for AliExpress API
  private signRequest(params: Record<string, string>): string {
    const sorted = Object.keys(params).sort();
    const concatenated = sorted.map(key => `${key}${params[key]}`).join('');
    return crypto
      .createHash('md5')
      .update(`${this.appSecret}${concatenated}${this.appSecret}`, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  // Get authorization URL for OAuth
  getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      force_auth: 'true',
      redirect_uri: this.callbackUrl,
      client_id: this.appKey,
      state: crypto.randomBytes(16).toString('hex'),
    });
    return `${this.authUrl}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const timestamp = new Date(Date.now() + 8 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const params: Record<string, string> = {
        method: 'auth.token.create',
        app_key: this.appKey,
        sign_method: 'md5',
        timestamp,
        format: 'json',
        v: '2.0',
        code,
      };
      params.sign = this.signRequest(params);

      const body = new URLSearchParams(params);
      const response = await fetch(`${this.apiGateway}/router/rest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: body.toString(),
      });

      const data = await response.json();

      if (data.error_response) {
        throw new HttpException(
          data.error_response.msg || 'Token exchange failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const tokenData = data.auth_token_create_response || data;

      // Store token in database
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 31104000) * 1000);
      const refreshExpiresAt = new Date(Date.now() + (tokenData.refresh_expires_in || 31104000) * 1000);

      await this.prisma.aliExpressToken.create({
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          userId: tokenData.user_id?.toString() || 'unknown',
          sellerId: tokenData.seller_id?.toString(),
          account: tokenData.account,
          expiresAt,
          refreshExpiresAt,
        },
      });

      return { success: true, sellerId: tokenData.seller_id };
    } catch (error) {
      this.logger.error('Token exchange failed', error);
      throw new HttpException('Failed to exchange token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get a valid access token (refresh if expired)
  private async getValidToken(): Promise<string> {
    const token = await this.prisma.aliExpressToken.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      throw new HttpException('No AliExpress token found. Please authorize first.', HttpStatus.UNAUTHORIZED);
    }

    // Check if token is still valid
    if (new Date() < token.expiresAt) {
      return token.accessToken;
    }

    // Token expired, try to refresh
    if (token.refreshExpiresAt && new Date() < token.refreshExpiresAt) {
      return this.refreshToken(token.refreshToken, token.id);
    }

    throw new HttpException('AliExpress token expired. Please re-authorize.', HttpStatus.UNAUTHORIZED);
  }

  // Refresh an expired access token
  private async refreshToken(refreshToken: string, tokenId: string): Promise<string> {
    try {
      const timestamp = new Date(Date.now() + 8 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const params: Record<string, string> = {
        method: 'auth.token.refresh',
        app_key: this.appKey,
        sign_method: 'md5',
        timestamp,
        format: 'json',
        v: '2.0',
        refresh_token: refreshToken,
      };
      params.sign = this.signRequest(params);

      const body = new URLSearchParams(params);
      const response = await fetch(`${this.apiGateway}/router/rest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: body.toString(),
      });

      const data = await response.json();
      const tokenData = data.auth_token_refresh_response || data;

      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 31104000) * 1000);

      await this.prisma.aliExpressToken.update({
        where: { id: tokenId },
        data: {
          accessToken: tokenData.access_token,
          expiresAt,
        },
      });

      return tokenData.access_token;
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new HttpException('Token refresh failed', HttpStatus.UNAUTHORIZED);
    }
  }

  // Check if AliExpress is connected
  async isConnected(): Promise<boolean> {
    const token = await this.prisma.aliExpressToken.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return !!token && new Date() < token.expiresAt;
  }

  // Search products on AliExpress
  async searchProducts(keyword: string, options: {
    page?: number;
    pageSize?: number;
    currency?: string;
    shipTo?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}): Promise<any> {
    const accessToken = await this.getValidToken();
    const {
      page = 1,
      pageSize = 20,
      currency = 'USD',
      shipTo = 'NG',
    } = options;

    const timestamp = new Date(Date.now() + 8 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    const params: Record<string, string> = {
      method: 'aliexpress.affiliate.product.query',
      app_key: this.appKey,
      sign_method: 'md5',
      timestamp,
      format: 'json',
      v: '2.0',
      keywords: keyword,
      page_no: page.toString(),
      page_size: pageSize.toString(),
      target_currency: currency,
      target_language: 'EN',
      ship_to_country: shipTo,
      tracking_id: 'agromarket',
    };

    if (options.minPrice) params.min_sale_price = Math.round(options.minPrice * 100).toString();
    if (options.maxPrice) params.max_sale_price = Math.round(options.maxPrice * 100).toString();

    params.sign = this.signRequest(params);

    try {
      const body = new URLSearchParams(params);
      const response = await fetch(`${this.apiGateway}/router/rest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: body.toString(),
      });

      const data = await response.json();

      if (data.error_response) {
        this.logger.error('AliExpress search error', data.error_response);
        throw new HttpException(
          data.error_response.msg || 'Search failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = data.aliexpress_affiliate_product_query_response?.resp_result;
      const products = result?.result?.products || [];

      return {
        products: products.map((p: any) => this.formatSearchProduct(p)),
        totalResults: result?.result?.total_record_count || 0,
        page,
        pageSize,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Search failed', error);
      throw new HttpException('Failed to search AliExpress', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get single product details
  async getProductDetails(productId: string): Promise<any> {
    const accessToken = await this.getValidToken();

    const timestamp = new Date(Date.now() + 8 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    const params: Record<string, string> = {
      method: 'aliexpress.ds.product.get',
      app_key: this.appKey,
      sign_method: 'md5',
      timestamp,
      format: 'json',
      v: '2.0',
      product_id: productId,
      ship_to_country: 'NG',
      target_currency: 'USD',
      target_language: 'EN',
    };
    params.sign = this.signRequest(params);

    try {
      const body = new URLSearchParams(params);
      const response = await fetch(`${this.apiGateway}/router/rest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: body.toString(),
      });

      const data = await response.json();

      if (data.error_response) {
        throw new HttpException(
          data.error_response.msg || 'Product fetch failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.formatProductDetail(data);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Product fetch failed', error);
      throw new HttpException('Failed to fetch product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Import products from AliExpress to draft
  async importProducts(productIds: string[], adminId: string, categoryId?: string): Promise<any> {
    const imported = [];
    const failed = [];

    for (const productId of productIds) {
      try {
        // Check if already imported
        const existing = await this.prisma.dropshipProduct.findUnique({
          where: { aliexpressId: productId },
        });

        if (existing) {
          failed.push({ productId, reason: 'Already imported' });
          continue;
        }

        // Fetch product details
        const product = await this.getProductDetails(productId);
        const detail = product.detail || product;

        // Calculate prices
        const originalPrice = parseFloat(detail.originalPrice || detail.sale_price || '0');
        const markupPrice = originalPrice * this.markupMultiplier;
        const sellingPrice = markupPrice + (markupPrice * this.platformFeePercent / 100);

        // Generate slug
        const slug = this.generateSlug(detail.title || `product-${productId}`);

        // Use provided category or default to first available
        let finalCategoryId = categoryId;
        if (!finalCategoryId) {
          const defaultCategory = await this.prisma.categoryModel.findFirst();
          finalCategoryId = defaultCategory?.id || '';
        }

        // Get existing slugs to ensure uniqueness
        const existingSlug = await this.prisma.dropshipProduct.findUnique({ where: { slug } });
        const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

        const dropshipProduct = await this.prisma.dropshipProduct.create({
          data: {
            aliexpressId: productId,
            aliexpressUrl: detail.productUrl || `https://www.aliexpress.com/item/${productId}.html`,
            originalTitle: detail.title || 'Unknown Product',
            originalPrice,
            originalImages: detail.images || [],
            originalDescription: detail.description || '',
            title: detail.title || 'Unknown Product',
            slug: finalSlug,
            description: detail.description || '',
            price: sellingPrice,
            markupPrice,
            images: detail.images || [],
            specs: detail.specs || {},
            categoryId: finalCategoryId,
            adminId,
          },
          include: { category: true },
        });

        imported.push(dropshipProduct);
      } catch (error) {
        this.logger.error(`Failed to import product ${productId}`, error);
        failed.push({ productId, reason: error.message || 'Import failed' });
      }
    }

    return { imported, failed };
  }

  // Get draft products
  async getDrafts(adminId: string, page = 1, limit = 20) {
    const [drafts, total] = await Promise.all([
      this.prisma.dropshipProduct.findMany({
        where: { adminId, status: 'DRAFT' },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dropshipProduct.count({
        where: { adminId, status: 'DRAFT' },
      }),
    ]);

    return {
      data: drafts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Update draft product
  async updateDraft(id: string, data: any) {
    const draft = await this.prisma.dropshipProduct.findUnique({ where: { id } });
    if (!draft) throw new HttpException('Draft not found', HttpStatus.NOT_FOUND);
    if (draft.status !== 'DRAFT') throw new HttpException('Can only edit draft products', HttpStatus.BAD_REQUEST);

    const updateData: any = {};
    if (data.title) {
      updateData.title = data.title;
      updateData.slug = this.generateSlug(data.title);
    }
    if (data.description) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.images) updateData.images = data.images;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.inStock !== undefined) updateData.inStock = data.inStock;

    return this.prisma.dropshipProduct.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  // Publish draft to marketplace
  async publishDraft(id: string) {
    const draft = await this.prisma.dropshipProduct.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!draft) throw new HttpException('Draft not found', HttpStatus.NOT_FOUND);
    if (draft.status !== 'DRAFT') throw new HttpException('Can only publish draft products', HttpStatus.BAD_REQUEST);

    // Find or create a dropshipping company
    let company = await this.prisma.company.findFirst({
      where: { name: 'AgroMarket Dropship' },
    });

    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: 'AgroMarket Dropship',
          description: 'Official AgroMarket dropshipping supplier',
          isVerified: true,
        },
      });
    }

    // Create the product
    const product = await this.prisma.product.create({
      data: {
        title: draft.title,
        slug: draft.slug,
        description: draft.description,
        price: draft.price,
        condition: draft.condition,
        images: draft.images,
        specs: draft.specs || {},
        inStock: draft.inStock,
        stockQuantity: draft.stockQuantity,
        status: 'APPROVED', // Auto-approve admin-published products
        categoryId: draft.categoryId,
        sellerId: draft.adminId,
        companyId: company.id,
      },
    });

    // Update draft status
    await this.prisma.dropshipProduct.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedProductId: product.id,
      },
    });

    return product;
  }

  // Delete draft
  async deleteDraft(id: string) {
    const draft = await this.prisma.dropshipProduct.findUnique({ where: { id } });
    if (!draft) throw new HttpException('Draft not found', HttpStatus.NOT_FOUND);
    if (draft.status === 'PUBLISHED') throw new HttpException('Cannot delete published products', HttpStatus.BAD_REQUEST);

    return this.prisma.dropshipProduct.delete({ where: { id } });
  }

  // Helper: Format search result product
  private formatSearchProduct(product: any) {
    return {
      id: product.product_id?.toString() || product.itemId?.toString(),
      title: product.product_title || product.title || 'Unknown',
      price: parseFloat(product.sale_price || product.min_sale_price || '0') / 100,
      originalPrice: parseFloat(product.target_sale_price || product.max_sale_price || '0') / 100,
      currency: product.target_sale_price_currency || 'USD',
      image: product.product_main_image_url || product.product_image || '',
      url: product.promotion_link || product.product_detail_url || '',
      rating: parseFloat(product.evaluate_rate || '0'),
      orders: parseInt(product.lastest_volume || product.last_180_orders || '0', 10),
      shipping: product.logistics_desc || '',
    };
  }

  // Helper: Format product detail
  private formatProductDetail(data: any) {
    const product = data.ds_product_get_response?.result || data.product || data;

    return {
      id: product.product_id?.toString() || product.itemId?.toString(),
      title: product.subject || product.title || 'Unknown',
      description: product.description || product.detail || '',
      originalPrice: parseFloat(product.min_price || product.sale_price || '0'),
      images: product.image_urls || product.images || [],
      productUrl: product.detail_url || `https://www.aliexpress.com/item/${product.product_id || product.itemId}.html`,
      specs: product.attributes || product.specs || {},
      shipping: product.logistics_info || {},
    };
  }

  // Helper: Generate slug from title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }
}
