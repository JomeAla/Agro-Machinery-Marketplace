import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto, VerifyPaymentDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for an order' })
  async initializePayment(@Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(dto);
  }

  @Post('verify')
  @Public()
  @ApiOperation({ summary: 'Verify payment by reference' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto.reference);
  }

  @Post('webhook/paystack')
  @Public()
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  async handlePaystackWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook('paystack', payload);
  }

  @Post('webhook/flutterwave')
  @Public()
  @ApiOperation({ summary: 'Flutterwave webhook endpoint' })
  async handleFlutterwaveWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook('flutterwave', payload);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for an order' })
  async getPaymentByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.getPaymentByOrder(orderId);
  }

  @Get('escrow/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get escrow status for an order' })
  async getEscrowByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.getEscrowByOrder(orderId);
  }

  @Post('escrow/:id/release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release escrow (Admin only)' })
  async releaseEscrow(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.releaseEscrow(id);
  }
}
