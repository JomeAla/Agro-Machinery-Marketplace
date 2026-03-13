import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  // ==================== Discount Codes ====================

  async getDiscountCodes() {
    return this.prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDiscountCodeById(id: string) {
    const code = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Discount code not found');
    return code;
  }

  async createDiscountCode(data: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    startsAt?: Date;
    expiresAt?: Date;
  }) {
    const existing = await this.prisma.discountCode.findUnique({ where: { code: data.code } });
    if (existing) throw new BadRequestException('Code already exists');

    return this.prisma.discountCode.create({
      data: {
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
      },
    });
  }

  async updateDiscountCode(id: string, data: {
    code?: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    minOrderAmount?: number;
    maxUses?: number;
    startsAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
  }) {
    const code = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Discount code not found');

    return this.prisma.discountCode.update({
      where: { id },
      data,
    });
  }

  async deleteDiscountCode(id: string) {
    const code = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Discount code not found');

    return this.prisma.discountCode.delete({ where: { id } });
  }

  async validateDiscountCode(code: string, orderAmount: number) {
    const discount = await this.prisma.discountCode.findUnique({ where: { code } });

    if (!discount) throw new NotFoundException('Invalid discount code');
    if (!discount.isActive) throw new BadRequestException('Discount code is not active');
    if (discount.expiresAt && new Date() > discount.expiresAt) throw new BadRequestException('Discount code has expired');
    if (discount.startsAt && new Date() < discount.startsAt) throw new BadRequestException('Discount code is not yet active');
    if (discount.maxUses && discount.usedCount >= discount.maxUses) throw new BadRequestException('Discount code usage limit reached');
    if (discount.minOrderAmount && orderAmount < Number(discount.minOrderAmount)) throw new BadRequestException(`Minimum order amount is ₦${discount.minOrderAmount}`);

    let discountAmount = 0;
    if (discount.discountType === 'PERCENTAGE') {
      discountAmount = (orderAmount * Number(discount.discountValue)) / 100;
    } else {
      discountAmount = Number(discount.discountValue);
    }

    return {
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    };
  }

  // ==================== Featured Slots ====================

  async getFeaturedSlots() {
    return this.prisma.featuredSlot.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getAllFeaturedSlots() {
    return this.prisma.featuredSlot.findMany({
      orderBy: { price: 'asc' },
      include: { purchases: { include: { product: true } } },
    });
  }

  async createFeaturedSlot(data: { name: string; duration: number; price: number; isActive?: boolean }) {
    return this.prisma.featuredSlot.create({ data });
  }

  async updateFeaturedSlot(id: string, data: { name?: string; duration?: number; price?: number; isActive?: boolean }) {
    const slot = await this.prisma.featuredSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Featured slot not found');

    return this.prisma.featuredSlot.update({ where: { id }, data });
  }

  async deleteFeaturedSlot(id: string) {
    const slot = await this.prisma.featuredSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Featured slot not found');

    return this.prisma.featuredSlot.delete({ where: { id } });
  }

  async purchaseFeaturedSlot(productId: string, slotId: string) {
    const slot = await this.prisma.featuredSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Featured slot not found');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + slot.duration);

    return this.prisma.featuredProduct.create({
      data: {
        productId,
        slotId,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });
  }

  async getActiveFeaturedProducts() {
    const now = new Date();
    return this.prisma.featuredProduct.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { product: true, slot: true },
    });
  }

  // ==================== Banners ====================

  async getBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getAllBanners() {
    return this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
  }

  async getBannerById(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async createBanner(data: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    linkText?: string;
    position?: string;
    startsAt?: Date;
    expiresAt?: Date;
    order?: number;
  }) {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        position: data.position || 'HOME',
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        order: data.order || 0,
      },
    });
  }

  async updateBanner(id: string, data: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    linkUrl?: string;
    linkText?: string;
    position?: string;
    startsAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
    order?: number;
  }) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    return this.prisma.banner.update({ where: { id }, data });
  }

  async deleteBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    return this.prisma.banner.delete({ where: { id } });
  }

  // ==================== Category Promotions ====================

  async getCategoryPromotions() {
    return this.prisma.categoryPromotion.findMany({
      include: { category: true },
      orderBy: { startsAt: 'desc' },
    });
  }

  async getActiveCategoryPromotions() {
    const now = new Date();
    return this.prisma.categoryPromotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      include: { category: true },
    });
  }

  async createCategoryPromotion(data: {
    categoryId: string;
    discountType: string;
    discountValue: number;
    startsAt: Date;
    expiresAt: Date;
  }) {
    return this.prisma.categoryPromotion.create({ data });
  }

  async updateCategoryPromotion(id: string, data: {
    categoryId?: string;
    discountType?: string;
    discountValue?: number;
    startsAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
  }) {
    const promo = await this.prisma.categoryPromotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Category promotion not found');

    return this.prisma.categoryPromotion.update({ where: { id }, data });
  }

  async deleteCategoryPromotion(id: string) {
    const promo = await this.prisma.categoryPromotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Category promotion not found');

    return this.prisma.categoryPromotion.delete({ where: { id } });
  }

  async getCategoryPromotion(categoryId: string) {
    const now = new Date();
    return this.prisma.categoryPromotion.findFirst({
      where: {
        categoryId,
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
    });
  }
}
