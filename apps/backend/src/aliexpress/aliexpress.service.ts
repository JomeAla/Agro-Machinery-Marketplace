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
    return `https://api-sg.aliexpress.com/oauth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const url = 'https://api-sg.aliexpress.com/rest/auth/token/create';
      const timestamp = Date.now().toString();

      const params: Record<string, string> = {
        app_key: this.appKey,
        sign_method: 'md5',
        timestamp,
        code,
      };

      // Generate TOP API signature with route path prepended
      const sorted = Object.keys(params).sort();
      const concatenated = '/auth/token/create' + sorted.map(key => `${key}${params[key]}`).join('');
      const sign = crypto
        .createHash('md5')
        .update(`${this.appSecret}${concatenated}${this.appSecret}`, 'utf8')
        .digest('hex')
        .toUpperCase();
      
      params.sign = sign;

      console.log('Exchanging code for token:', { url, code: code.substring(0, 10) + '...' });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: new URLSearchParams(params).toString(),
      });

      const responseText = await response.text();
      console.log(`Response from token create:`, responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new HttpException(`Invalid JSON from API: ${responseText.substring(0, 100)}`, HttpStatus.BAD_REQUEST);
      }

      if (data.error_response || data.error_message || (data.code && data.code !== '0' && data.type === 'ISP') || (data.code && !data.access_token)) {
        const errorMsg = data.error_response?.msg || data.error_message || data.message || data.code || 'Unknown error';
        throw new HttpException(`AliExpress Error: ${errorMsg}`, HttpStatus.BAD_REQUEST);
      }

      // Handle successful response format
      // AliExpress normally wraps successful TOP responses in an object matching the endpoint
      const tokenData = data.auth_token_create_response || data;

      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token || '';

      if (!accessToken) {
        throw new HttpException('No access token in response', HttpStatus.BAD_REQUEST);
      }

      console.log('SUCCESS! Extracted tokens:', { 
        accessToken: accessToken.substring(0, 20) + '...', 
        refreshToken: refreshToken.substring(0, 20) + '...'
      });

      // Store token in database
      const expiresInSeconds = parseInt(tokenData.expires_in || tokenData.expire_time || '31104000', 10);
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      const refreshExpiresAt = new Date(Date.now() + 31104000 * 1000); 

      await this.prisma.aliExpressToken.deleteMany({ where: { accessToken: '' } });

      await this.prisma.aliExpressToken.create({
        data: {
          accessToken,
          refreshToken,
          userId: tokenData.user_id?.toString() || tokenData.ali_id?.toString() || 'unknown',
          sellerId: tokenData.user_id?.toString() || null,
          account: tokenData.user_nick || null,
          expiresAt,
          refreshExpiresAt,
        },
      });

      return { success: true, userId: tokenData.user_id };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Token exchange exception:', error);
      this.logger.error('Token exchange failed', error);
      throw new HttpException(`Failed to exchange token: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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
      shipTo = 'NG', // Standard default for platform
    } = options;

    try {
      // 1. Detect if keyword is a direct AliExpress Product URL or ID
      let productId = '';
      if (/^\d{8,16}$/.test(keyword.trim())) {
        productId = keyword.trim();
      } else if (keyword.includes('aliexpress.com/item/')) {
        const match = keyword.match(/\/item\/(\d+)\.html/);
        if (match) productId = match[1];
      }

      if (productId) {
         // Fallback: direct product import request
         const details = await this.getProductDetails(productId, shipTo);
         return {
           products: [{
             id: details.id,
             title: details.title,
             price: details.originalPrice,
             originalPrice: details.originalPrice,
             image: details.images?.[0] || '',
             productUrl: details.productUrl,
             commission: 0,
             orders: 100 // Placeholder for single items
           }],
           totalResults: 1,
           page: 1,
           pageSize: 20
         };
      }

      // 2. Generic Keyword Search via DS Product Query
      const url = `https://api-sg.aliexpress.com/sync`;
      const timestamp = Date.now().toString();

      const payload: Record<string, string> = {
        method: 'aliexpress.ds.product.query',
        app_key: this.appKey,
        sign_method: 'md5',
        timestamp,
        format: 'json',
        v: '2.0',
        session: accessToken,
        keywords: keyword,
        page_no: page.toString(),
        page_size: pageSize.toString(),
        target_currency: currency,
        target_language: 'EN',
        ship_to_country: shipTo,
      };

      if (options.minPrice) payload.min_price = (options.minPrice * 100).toString();
      if (options.maxPrice) payload.max_price = (options.maxPrice * 100).toString();

      // Generate TOP API MD5 Signature
      const sorted = Object.keys(payload).sort();
      const concatenated = sorted.map(key => `${key}${payload[key]}`).join('');
      const sign = crypto
        .createHash('md5')
        .update(`${this.appSecret}${concatenated}${this.appSecret}`, 'utf8')
        .digest('hex')
        .toUpperCase();
      
      payload.sign = sign;

      console.log('AliExpress keyword search request:', { keyword, page });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new HttpException(`AliExpress returned invalid response`, HttpStatus.BAD_REQUEST);
      }

      if (data.error_response) {
        throw new HttpException(
          data.error_response.msg || 'Keyword search failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dsResult = data.aliexpress_ds_product_query_response?.result || data.ds_product_query_response?.result || { products: { product_dto: [] }, total_record_count: 0 };
      const products = dsResult.products?.product_dto || [];

      return {
        products: products.map(p => this.formatSearchProduct(p)),
        totalResults: dsResult.total_record_count || 0,
        page,
        pageSize
      };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Search failed', error);
      throw new HttpException(error.message || 'Failed to query AliExpress', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get single product details
  async getProductDetails(productId: string, shipTo: string = 'US'): Promise<any> {
    const accessToken = await this.getValidToken();

    try {
      const url = `https://api-sg.aliexpress.com/sync`;

      const payload: Record<string, string> = {
        method: 'aliexpress.ds.product.get',
        app_key: this.appKey,
        sign_method: 'md5',
        timestamp: Date.now().toString(),
        format: 'json',
        v: '2.0',
        session: accessToken,
        product_id: productId,
        target_currency: 'USD',
        target_language: 'EN',
        ship_to_country: shipTo,
      };

      // Ensure no optional values are strictly required but unprovided
      // Generate TOP API MD5 Signature
      const sorted = Object.keys(payload).sort();
      const concatenated = sorted.map(key => `${key}${payload[key]}`).join('');
      const sign = crypto
        .createHash('md5')
        .update(`${this.appSecret}${concatenated}${this.appSecret}`, 'utf8')
        .digest('hex')
        .toUpperCase();
      
      payload.sign = sign;

      console.log('AliExpress product detail request:', { url, productId });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new HttpException(`AliExpress returned invalid response`, HttpStatus.BAD_REQUEST);
      }

      if (data.error_response) {
        throw new HttpException(
          data.error_response.msg || 'Product fetch failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Many APIs might block certain products from being shipped, log it gently
      const dsProductResponse = data.aliexpress_ds_product_get_response || data;
      if (dsProductResponse.rsp_code !== 200) {
          console.warn('AliExpress Warning for product details:', dsProductResponse.rsp_msg);
      }

      return this.formatProductDetail(data);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Product fetch failed', error);
      throw new HttpException('Failed to fetch product from AliExpress', HttpStatus.INTERNAL_SERVER_ERROR);
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

        // Smart category resolution: auto-derive from AliExpress product data
        const finalCategoryId = await this.resolveCategory(categoryId, detail);

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
  async getDrafts(adminId: string, page?: number, limit?: number) {
    const pageNum = page && page > 0 ? page : 1;
    const limitNum = limit && limit > 0 ? limit : 20;

    const [drafts, total] = await Promise.all([
      this.prisma.dropshipProduct.findMany({
        where: { adminId, status: 'DRAFT' },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.dropshipProduct.count({
        where: { adminId, status: 'DRAFT' },
      }),
    ]);

    return {
      data: drafts,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
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
        stockQuantity: draft.inStock ? 99 : 0,
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
    const dsResult = data.aliexpress_ds_product_get_response?.result || data.ds_product_get_response?.result || data.product || data;
    const baseInfo = dsResult.ae_item_base_info_dto || dsResult;
    const mediaInfo = dsResult.ae_multimedia_info_dto || dsResult;
    const skuInfo = dsResult.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o?.[0] || dsResult;
    const storeInfo = dsResult.ae_store_info || {};
    const properties = dsResult.ae_item_properties?.ae_item_property || [];

    // Handle images (semi-colon separated in new API, or fallback to array)
    let images = mediaInfo.image_urls || mediaInfo.images || [];
    if (typeof images === 'string') {
      images = images.split(';');
    }

    // Extract useful property values for category derivation
    const typeProperty = properties.find?.((p: any) => p.attr_name === 'Type');
    const industryProperty = properties.find?.((p: any) => p.attr_name === 'Applicable Industries');

    return {
      id: baseInfo.product_id?.toString() || baseInfo.itemId?.toString() || 'Unknown ID',
      title: baseInfo.subject || baseInfo.title || 'Unknown',
      description: baseInfo.detail || baseInfo.description || '',
      originalPrice: parseFloat(skuInfo.offer_sale_price || skuInfo.sku_price || skuInfo.min_price || baseInfo.sale_price || '0'),
      images: images,
      productUrl: baseInfo.detail_url || `https://www.aliexpress.com/item/${baseInfo.product_id || baseInfo.itemId}.html`,
      specs: properties.length > 0 ? properties : (baseInfo.attributes || baseInfo.specs || {}),
      shipping: dsResult.logistics_info_dto || baseInfo.logistics_info || {},
      // Extra metadata for smart category auto-creation
      aliexpressCategoryId: baseInfo.category_id?.toString() || null,
      productType: typeProperty?.attr_value || null,
      applicableIndustry: industryProperty?.attr_value || null,
      storeName: storeInfo.store_name || null,
      salesCount: baseInfo.sales_count || '0',
    };
  }

  // Helper: Intelligently resolve or auto-create a platform category from AliExpress product data
  private async resolveCategory(explicitCategoryId: string | undefined, detail: any): Promise<string> {
    // 1. If explicit categoryId was provided and is valid, use it
    if (explicitCategoryId) {
      const exists = await this.prisma.categoryModel.findUnique({ where: { id: explicitCategoryId } });
      if (exists) return explicitCategoryId;
    }

    // 2. Derive a category name from the AliExpress product metadata
    const categoryName = this.deriveCategoryName(detail);
    const categorySlug = this.generateSlug(categoryName);

    // 3. Upsert: find existing category by slug, or create it
    const category = await this.prisma.categoryModel.upsert({
      where: { slug: categorySlug },
      update: {}, // Don't overwrite if it already exists
      create: {
        name: categoryName,
        slug: categorySlug,
        description: `Auto-created category for ${categoryName} products imported from AliExpress`,
      },
    });

    return category.id;
  }

  // Helper: Derive a human-readable category name from AliExpress product data
  private deriveCategoryName(detail: any): string {
    const title = (detail.title || '').toLowerCase();
    const productType = detail.productType || '';
    const industry = detail.applicableIndustry || '';

    // Agro-machinery keyword mapping (ordered by specificity)
    const categoryMap: { keywords: string[]; name: string }[] = [
      { keywords: ['tractor', 'wheel tractor', 'farm tractor'], name: 'Tractors' },
      { keywords: ['harvester', 'combine', 'reaper'], name: 'Harvesters' },
      { keywords: ['plough', 'plow', 'disc plow', 'moldboard'], name: 'Ploughs & Tillage' },
      { keywords: ['seeder', 'planter', 'seed drill', 'sowing'], name: 'Seeders & Planters' },
      { keywords: ['sprayer', 'fumigator', 'crop sprayer'], name: 'Sprayers' },
      { keywords: ['irrigation', 'drip', 'sprinkler', 'water pump'], name: 'Irrigation Equipment' },
      { keywords: ['mower', 'lawn mower', 'grass cutter', 'brush cutter'], name: 'Mowers & Cutters' },
      { keywords: ['excavator', 'digger', 'backhoe', 'loader'], name: 'Excavators & Loaders' },
      { keywords: ['generator', 'power generator', 'diesel generator'], name: 'Generators & Power' },
      { keywords: ['trailer', 'farm trailer', 'dump trailer'], name: 'Trailers' },
      { keywords: ['rice', 'paddy', 'rice mill', 'thresher'], name: 'Rice Processing' },
      { keywords: ['feed', 'pellet', 'feed mixer', 'feed mill'], name: 'Feed Processing' },
      { keywords: ['greenhouse', 'poly tunnel', 'grow tent'], name: 'Greenhouse Equipment' },
      { keywords: ['drone', 'agricultural drone', 'crop drone'], name: 'Agricultural Drones' },
      { keywords: ['chainsaw', 'wood chipper', 'log splitter'], name: 'Forestry Equipment' },
      { keywords: ['pump', 'water pump', 'submersible'], name: 'Pumps' },
      { keywords: ['engine', 'diesel engine', 'motor'], name: 'Engines & Motors' },
      { keywords: ['spare', 'part', 'replacement', 'accessory', 'attachment'], name: 'Parts & Accessories' },
    ];

    // Check productType first (most specific from AliExpress)
    if (productType) {
      for (const mapping of categoryMap) {
        if (mapping.keywords.some(kw => productType.toLowerCase().includes(kw))) {
          return mapping.name;
        }
      }
    }

    // Check title keywords
    for (const mapping of categoryMap) {
      if (mapping.keywords.some(kw => title.includes(kw))) {
        return mapping.name;
      }
    }

    // Check industry
    if (industry) {
      const lowerIndustry = industry.toLowerCase();
      if (lowerIndustry.includes('farm') || lowerIndustry.includes('agri')) return 'Farm Equipment';
      if (lowerIndustry.includes('construction')) return 'Construction Equipment';
      if (lowerIndustry.includes('food')) return 'Food Processing';
    }

    // Final fallback: use a generic but still meaningful name
    return 'General Equipment';
  }

  // Helper: Generate slug from title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  // ==================== ORDER FULFILLMENT ====================

  async createDropshipOrder(params: {
    orderId: string;
    platformProductId: string;
    aliexpressProductId: string;
    quantity: number;
    aliexpressPrice: number;
    sellingPrice: number;
    shippingAddress: string;
    shippingState?: string;
  }) {
    const platformOrder = await this.prisma.order.findUnique({
      where: { id: params.orderId },
      include: { buyer: true },
    });

    if (!platformOrder) {
      throw new HttpException('Platform order not found', HttpStatus.NOT_FOUND);
    }

    const profit = params.sellingPrice - (params.aliexpressPrice * params.quantity);
    
    const dropshipOrder = await this.prisma.dropshipOrder.create({
      data: {
        orderId: params.orderId,
        platformProductId: params.platformProductId,
        aliexpressProductId: params.aliexpressProductId,
        buyerId: platformOrder.buyerId,
        quantity: params.quantity,
        aliexpressPrice: params.aliexpressPrice,
        sellingPrice: params.sellingPrice,
        profit,
        shippingAddress: params.shippingAddress,
        shippingState: params.shippingState,
        status: 'PENDING',
      },
    });

    return dropshipOrder;
  }

  async placeAliExpressOrder(dropshipOrderId: string) {
    const dropshipOrder = await this.prisma.dropshipOrder.findUnique({
      where: { id: dropshipOrderId },
    });

    if (!dropshipOrder) {
      throw new HttpException('Dropship order not found', HttpStatus.NOT_FOUND);
    }

    if (dropshipOrder.status !== 'PENDING') {
      throw new HttpException('Order already processed', HttpStatus.BAD_REQUEST);
    }

    const accessToken = await this.getValidToken();

    try {
      const url = 'https://api-sg.aliexpress.com/sync';
      const timestamp = Date.now().toString();

      const payload: any = {
        method: 'aliexpress.trade.buy.place',
        app_key: this.appKey,
        sign_method: 'md5',
        timestamp,
        format: 'json',
        v: '2.0',
        session: accessToken,
        product_id: dropshipOrder.aliexpressProductId,
        quantity: dropshipOrder.quantity.toString(),
        address: dropshipOrder.shippingAddress,
      };

      const sorted = Object.keys(payload).sort();
      const concatenated = sorted.map(key => `${key}${payload[key]}`).join('');
      const sign = crypto
        .createHash('md5')
        .update(`${this.appSecret}${concatenated}${this.appSecret}`, 'utf8')
        .digest('hex')
        .toUpperCase();
      payload.sign = sign;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const data = await response.json();
      
      if (data.error_response) {
        throw new HttpException(
          data.error_response.msg || 'Failed to place AliExpress order',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = data.aliexpress_trade_buy_place_response || data;
      
      if (result.success === 'true' || result.success === true) {
        const aliexpressOrderId = result.order_id || result.aliexpress_order_id;
        
        await this.prisma.dropshipOrder.update({
          where: { id: dropshipOrderId },
          data: {
            aliexpressOrderId,
            status: 'PROCESSING',
            aliexpressPaidAt: new Date(),
          },
        });

        return { success: true, aliexpressOrderId };
      }

      throw new HttpException('Failed to place order on AliExpress', HttpStatus.BAD_REQUEST);

    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to place AliExpress order', error);
      throw new HttpException('Failed to place order', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDropshipOrderStatus(dropshipOrderId: string) {
    const dropshipOrder = await this.prisma.dropshipOrder.findUnique({
      where: { id: dropshipOrderId },
    });

    if (!dropshipOrder) {
      throw new HttpException('Dropship order not found', HttpStatus.NOT_FOUND);
    }

    if (!dropshipOrder.aliexpressOrderId) {
      return { status: dropshipOrder.status, aliexpressOrderId: null };
    }

    const accessToken = await this.getValidToken();

    try {
      const url = 'https://api-sg.aliexpress.com/sync';
      const timestamp = Date.now().toString();

      const payload: any = {
        method: 'aliexpress.trade.buy.get',
        app_key: this.appKey,
        sign_method: 'md5',
        timestamp,
        format: 'json',
        v: '2.0',
        session: accessToken,
        order_id: dropshipOrder.aliexpressOrderId,
      };

      const sorted = Object.keys(payload).sort();
      const concatenated = sorted.map(key => `${key}${payload[key]}`).join('');
      const sign = crypto
        .createHash('md5')
        .update(`${this.appSecret}${concatenated}${this.appSecret}`, 'utf8')
        .digest('hex')
        .toUpperCase();
      payload.sign = sign;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const data = await response.json();
      const result = data.aliexpress_trade_buy_get_response || data;

      let newStatus = dropshipOrder.status;
      let trackingNumber = dropshipOrder.aliexpressTracking;

      if (result.order) {
        const aliOrder = result.order;
        if (aliOrder.status === 'WAIT_SELLER_SEND_GOODS') {
          newStatus = 'PROCESSING';
        } else if (aliOrder.status === 'SELLER_SENT_GOODS' || aliOrder.status === 'IN_TRADE') {
          newStatus = 'SHIPPED';
          if (aliOrder.tracking_no) {
            trackingNumber = aliOrder.tracking_no;
          }
        } else if (aliOrder.status === 'TRADE_FINISHED') {
          newStatus = 'DELIVERED';
        } else if (aliOrder.status === 'CANCEL') {
          newStatus = 'CANCELLED';
        }
      }

      if (newStatus !== dropshipOrder.status || trackingNumber !== dropshipOrder.aliexpressTracking) {
        await this.prisma.dropshipOrder.update({
          where: { id: dropshipOrderId },
          data: {
            status: newStatus,
            aliexpressTracking: trackingNumber,
            aliexpressShippedAt: newStatus === 'SHIPPED' ? new Date() : null,
            aliexpressDeliveredAt: newStatus === 'DELIVERED' ? new Date() : null,
          },
        });
      }

      return {
        status: newStatus,
        aliexpressOrderId: dropshipOrder.aliexpressOrderId,
        trackingNumber,
      };

    } catch (error) {
      this.logger.error('Failed to get order status', error);
      return {
        status: dropshipOrder.status,
        aliexpressOrderId: dropshipOrder.aliexpressOrderId,
        trackingNumber: dropshipOrder.aliexpressTracking,
      };
    }
  }

  async getDropshipOrders(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as any } : {};
    
    const [orders, total] = await Promise.all([
      this.prisma.dropshipOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dropshipOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ==================== INVENTORY & PRICE SYNC ====================

  async syncDropshipProductPrice(aliexpressProductId: string) {
    const product = await this.prisma.dropshipProduct.findUnique({
      where: { aliexpressId: aliexpressProductId },
      include: { category: true },
    });

    if (!product || product.status !== 'PUBLISHED') {
      throw new HttpException('Dropship product not found or not published', HttpStatus.NOT_FOUND);
    }

    const details = await this.getProductDetails(aliexpressProductId);
    const newOriginalPrice = parseFloat(details.originalPrice || details.sale_price || '0');
    const newMarkupPrice = newOriginalPrice * this.markupMultiplier;
    const newSellingPrice = newMarkupPrice + (newMarkupPrice * this.platformFeePercent / 100);

    await this.prisma.dropshipProduct.update({
      where: { id: product.id },
      data: {
        originalPrice: newOriginalPrice,
        markupPrice: newMarkupPrice,
        price: newSellingPrice,
        originalImages: details.images || [],
      },
    });

    if (product.publishedProductId) {
      await this.prisma.product.update({
        where: { id: product.publishedProductId },
        data: {
          price: newSellingPrice,
          images: details.images || [],
        },
      });
    }

    return {
      originalPrice: newOriginalPrice,
      markupPrice: newMarkupPrice,
      sellingPrice: newSellingPrice,
    };
  }

  async syncAllDropshipProducts() {
    const products = await this.prisma.dropshipProduct.findMany({
      where: { status: 'PUBLISHED' },
    });

    const results = [];
    for (const product of products) {
      try {
        const updated = await this.syncDropshipProductPrice(product.aliexpressId);
        results.push({
          id: product.id,
          aliexpressId: product.aliexpressId,
          success: true,
          ...updated,
        });
      } catch (error) {
        results.push({
          id: product.id,
          aliexpressId: product.aliexpressId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  // ==================== PROFIT REPORTS ====================

  async getProfitReport() {
    const orders = await this.prisma.dropshipOrder.findMany({
      where: {
        status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'PAID'] },
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.sellingPrice), 0);
    const totalCost = orders.reduce((sum, o) => sum + Number(o.aliexpressPrice) * o.quantity, 0);
    const totalProfit = orders.reduce((sum, o) => sum + Number(o.profit), 0);

    const byStatus = await this.prisma.dropshipOrder.groupBy({
      by: ['status'],
      _sum: { profit: true, sellingPrice: true },
      _count: true,
    });

    return {
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      },
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        revenue: s._sum.sellingPrice || 0,
        profit: s._sum.profit || 0,
      })),
    };
  }
}
