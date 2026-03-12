import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // ==================== Public Routes ====================

  @Get('banners')
  @ApiOperation({ summary: 'Get active banners' })
  async getBanners() {
    return this.promotionsService.getBanners();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get active featured products' })
  async getFeaturedProducts() {
    return this.promotionsService.getActiveFeaturedProducts();
  }

  @Get('featured-slots')
  @ApiOperation({ summary: 'Get available featured slots' })
  async getFeaturedSlots() {
    return this.promotionsService.getFeaturedSlots();
  }

  @Get('validate-code')
  @ApiOperation({ summary: 'Validate discount code' })
  async validateCode(
    @Query('code') code: string,
    @Query('amount') amount: string,
  ) {
    return this.promotionsService.validateDiscountCode(code, parseFloat(amount));
  }

  @Get('category-promotions')
  @ApiOperation({ summary: 'Get active category promotions' })
  async getCategoryPromotions() {
    return this.promotionsService.getActiveCategoryPromotions();
  }

  // ==================== Admin Routes ====================

  @Get('admin/discount-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all discount codes (Admin)' })
  async getDiscountCodes() {
    return this.promotionsService.getDiscountCodes();
  }

  @Post('admin/discount-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create discount code (Admin)' })
  async createDiscountCode(@Body() data: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    startsAt?: string;
    expiresAt?: string;
  }) {
    return this.promotionsService.createDiscountCode({
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
  }

  @Patch('admin/discount-codes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update discount code (Admin)' })
  async updateDiscountCode(@Param('id') id: string, @Body() data: any) {
    if (data.startsAt) data.startsAt = new Date(data.startsAt);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    return this.promotionsService.updateDiscountCode(id, data);
  }

  @Delete('admin/discount-codes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete discount code (Admin)' })
  async deleteDiscountCode(@Param('id') id: string) {
    return this.promotionsService.deleteDiscountCode(id);
  }

  @Get('admin/featured-slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all featured slots (Admin)' })
  async getAllFeaturedSlots() {
    return this.promotionsService.getAllFeaturedSlots();
  }

  @Post('admin/featured-slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create featured slot (Admin)' })
  async createFeaturedSlot(@Body() data: { name: string; duration: number; price: number }) {
    return this.promotionsService.createFeaturedSlot(data);
  }

  @Patch('admin/featured-slots/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update featured slot (Admin)' })
  async updateFeaturedSlot(@Param('id') id: string, @Body() data: any) {
    return this.promotionsService.updateFeaturedSlot(id, data);
  }

  @Delete('admin/featured-slots/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete featured slot (Admin)' })
  async deleteFeaturedSlot(@Param('id') id: string) {
    return this.promotionsService.deleteFeaturedSlot(id);
  }

  @Post('admin/featured')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase featured slot for product' })
  async purchaseFeaturedSlot(@Body() data: { productId: string; slotId: string }) {
    return this.promotionsService.purchaseFeaturedSlot(data.productId, data.slotId);
  }

  @Get('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all banners (Admin)' })
  async getAllBanners() {
    return this.promotionsService.getAllBanners();
  }

  @Post('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create banner (Admin)' })
  async createBanner(@Body() data: any) {
    return this.promotionsService.createBanner({
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
  }

  @Patch('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update banner (Admin)' })
  async updateBanner(@Param('id') id: string, @Body() data: any) {
    if (data.startsAt) data.startsAt = new Date(data.startsAt);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    return this.promotionsService.updateBanner(id, data);
  }

  @Delete('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete banner (Admin)' })
  async deleteBanner(@Param('id') id: string) {
    return this.promotionsService.deleteBanner(id);
  }

  @Get('admin/category-promotions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all category promotions (Admin)' })
  async getAllCategoryPromotions() {
    return this.promotionsService.getCategoryPromotions();
  }

  @Post('admin/category-promotions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category promotion (Admin)' })
  async createCategoryPromotion(@Body() data: {
    categoryId: string;
    discountType: string;
    discountValue: number;
    startsAt: string;
    expiresAt: string;
  }) {
    return this.promotionsService.createCategoryPromotion({
      ...data,
      startsAt: new Date(data.startsAt),
      expiresAt: new Date(data.expiresAt),
    });
  }

  @Patch('admin/category-promotions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category promotion (Admin)' })
  async updateCategoryPromotion(@Param('id') id: string, @Body() data: any) {
    if (data.startsAt) data.startsAt = new Date(data.startsAt);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    return this.promotionsService.updateCategoryPromotion(id, data);
  }

  @Delete('admin/category-promotions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category promotion (Admin)' })
  async deleteCategoryPromotion(@Param('id') id: string) {
    return this.promotionsService.deleteCategoryPromotion(id);
  }
}
