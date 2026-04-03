import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseUUIDPipe, HttpException, HttpStatus, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AliExpressService } from './aliexpress.service';
import { AliExpressSearchDto, ImportProductsDto, UpdateDraftDto } from './dto/aliexpress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('AliExpress Dropshipping')
@Controller('aliexpress')
export class AliExpressController {
  constructor(private readonly aliexpressService: AliExpressService) {}

  @Get('callback')
  @Public()
  @Redirect('http://localhost:3000/admin/dropshipping', 302)
  @ApiOperation({ summary: 'AliExpress OAuth callback handler' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    if (!code) {
      throw new HttpException('Authorization code missing', HttpStatus.BAD_REQUEST);
    }

    const result = await this.aliexpressService.exchangeCodeForToken(code);
    return { url: 'http://localhost:3000/admin/dropshipping' };
  }

  @Get('auth/url')
  @Public()
  @ApiOperation({ summary: 'Get AliExpress authorization URL' })
  async getAuthUrl() {
    const isConnected = await this.aliexpressService.isConnected();
    if (isConnected) {
      return { connected: true, message: 'Already connected to AliExpress' };
    }

    const url = this.aliexpressService.getAuthUrl();
    return { connected: false, authUrl: url };
  }

  @Get('auth/status')
  @Public()
  @ApiOperation({ summary: 'Check AliExpress connection status' })
  async getAuthStatus() {
    const isConnected = await this.aliexpressService.isConnected();
    return { connected: isConnected };
  }

  @Post('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search products on AliExpress' })
  async searchProducts(@Body() dto: AliExpressSearchDto) {
    return this.aliexpressService.searchProducts(dto.keyword, {
      page: dto.page,
      pageSize: dto.pageSize,
      currency: dto.currency,
      shipTo: dto.shipTo,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
    });
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AliExpress product details' })
  async getProductDetails(@Param('id') id: string) {
    return this.aliexpressService.getProductDetails(id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import selected products to drafts' })
  async importProducts(@Request() req, @Body() dto: ImportProductsDto) {
    return this.aliexpressService.importProducts(dto.productIds, req.user.id, dto.categoryId);
  }

  @Get('drafts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get draft (imported) products' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDrafts(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.aliexpressService.getDrafts(req.user.id, page, limit);
  }

  @Patch('drafts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a draft product' })
  async updateDraft(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDraftDto) {
    return this.aliexpressService.updateDraft(id, dto);
  }

  @Post('drafts/:id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish draft to marketplace' })
  async publishDraft(@Param('id', ParseUUIDPipe) id: string) {
    return this.aliexpressService.publishDraft(id);
  }

  @Delete('drafts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a draft product' })
  async deleteDraft(@Param('id', ParseUUIDPipe) id: string) {
    return this.aliexpressService.deleteDraft(id);
  }
}
