import { Controller, Get, Post, Query, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('seller')
  @ApiOperation({ summary: 'Get business analytics for the seller dashboard' })
  async getSellerStats(@Request() req) {
    return this.analyticsService.getSellerStats(req.user.id);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get platform-wide admin analytics' })
  async getAdminStats(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      throw new Error('Forbidden: Admin access only');
    }
    return this.analyticsService.getAdminStats();
  }

  @Get('product-lines')
  @ApiOperation({ summary: 'Get product line analytics with filters' })
  async getProductLineAnalytics(
    @Request() req,
    @Query('categoryId') categoryId?: string,
    @Query('productId') productId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getProductLineAnalytics(req.user.id, {
      categoryId,
      productId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('sales-trends')
  @ApiOperation({ summary: 'Get sales trends over time' })
  async getSalesTrends(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.analyticsService.getSalesTrends(req.user.id, {
      period,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      categoryId,
    });
  }

  @Post('export')
  @ApiOperation({ summary: 'Export report data (CSV or JSON)' })
  async exportReport(
    @Request() req,
    @Body() body: {
      format: 'csv' | 'json';
      type: 'orders' | 'products' | 'revenue';
      categoryId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    return this.analyticsService.exportReport(req.user.id, body.format, body);
  }
}
