import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComparisonService } from './comparison.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Comparison')
@Controller('comparison')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product to comparison' })
  async addToComparison(
    @Request() req,
    @Body() body: { productId: string },
  ) {
    return this.comparisonService.addToComparison(req.user.id, body.productId);
  }

  @Post('remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product from comparison' })
  async removeFromComparison(
    @Request() req,
    @Body() body: { productId: string },
  ) {
    return this.comparisonService.removeFromComparison(req.user.id, body.productId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my comparison list' })
  async getMyComparison(@Request() req) {
    return this.comparisonService.getMyComparison(req.user.id);
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear comparison list' })
  async clearComparison(@Request() req) {
    return this.comparisonService.clearComparison(req.user.id);
  }

  @Get('details')
  @ApiOperation({ summary: 'Get comparison details for multiple products' })
  async getComparisonDetails(@Query('ids') ids: string) {
    const productIds = ids.split(',');
    return this.comparisonService.getComparisonDetails('', productIds);
  }
}
