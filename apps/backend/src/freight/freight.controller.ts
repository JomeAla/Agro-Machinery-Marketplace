import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FreightService } from './freight.service';
import { CalculateFreightDto, CreateFreightQuoteDto, UpdateFreightStatusDto } from './dto/freight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Freight')
@Controller('freight')
export class FreightController {
  constructor(private readonly freightService: FreightService) {}

  @Get('states')
  @Public()
  @ApiOperation({ summary: 'Get list of Nigerian states' })
  async getStates() {
    return this.freightService.getNigerianStates();
  }

  @Post('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate freight cost estimate' })
  async calculateFreight(@Body() dto: CalculateFreightDto) {
    return this.freightService.calculateFreight(dto);
  }

  @Post('quotes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create freight quote for an order (Seller)' })
  async createQuote(@Request() req, @Body() dto: CreateFreightQuoteDto) {
    return this.freightService.createQuote(req.user.id, dto);
  }

  @Get('quotes/order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get freight quotes for an order' })
  async getQuotesByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.freightService.getQuotesByOrder(orderId);
  }

  @Patch('quotes/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update freight quote status' })
  async updateStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFreightStatusDto,
  ) {
    return this.freightService.updateStatus(id, req.user.id, dto);
  }
}
