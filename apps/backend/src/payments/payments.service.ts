import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { InitializePaymentDto, VerifyPaymentDto } from './dto/payments.dto';

const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async initializePayment(dto: InitializePaymentDto) {
    const settings = await this.settingsService.getSettings();
    const provider = settings.paymentProvider;

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    let paymentUrl: string;
    let providerRef: string;

    if (provider === 'PAYSTACK') {
      const result = await this.paystackInitialize(dto, settings);
      paymentUrl = result.authorization_url;
      providerRef = result.reference;
    } else {
      const result = await this.flutterwaveInitialize(dto, settings);
      paymentUrl = result.link;
      providerRef = result.tx_ref;
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        provider,
        providerRef,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      paymentId: payment.id,
      paymentUrl,
      providerRef,
      provider,
    };
  }

  private async paystackInitialize(dto: InitializePaymentDto, settings: any): Promise<any> {
    const config = settings.paystackConfig;
    if (!config || !config.secretKey) {
      throw new BadRequestException('Paystack is not configured');
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: dto.amount * 100,
        email: dto.customerEmail,
        currency: dto.currency,
        reference: `PSK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          orderId: dto.orderId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
        },
      }),
    });

    const data = await response.json();
    if (!data.status) {
      throw new BadRequestException(data.message || 'Paystack initialization failed');
    }

    return data.data;
  }

  private async flutterwaveInitialize(dto: InitializePaymentDto, settings: any): Promise<any> {
    const config = settings.flutterwaveConfig;
    if (!config || !config.secretKey) {
      throw new BadRequestException('Flutterwave is not configured');
    }

    const txRef = `FLW_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: dto.amount,
        currency: dto.currency,
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        customer: {
          email: dto.customerEmail,
          name: dto.customerName,
          phonenumber: dto.customerPhone,
        },
        customizations: {
          title: 'Agro Market',
        },
        meta: {
          orderId: dto.orderId,
        },
      }),
    });

    const data = await response.json();
    if (data.status !== 'success') {
      throw new BadRequestException(data.message || 'Flutterwave initialization failed');
    }

    return data.data;
  }

  async verifyPayment(reference: string) {
    const settings = await this.settingsService.getSettings();
    const provider = settings.paymentProvider;

    let isValid = false;
    let paymentData: any;

    if (provider === 'PAYSTACK') {
      const result = await this.paystackVerify(reference, settings);
      isValid = result.status;
      paymentData = result.data;
    } else {
      const result = await this.flutterwaveVerify(reference, settings);
      isValid = result.success;
      paymentData = result.data;
    }

    if (!isValid) {
      throw new BadRequestException('Payment verification failed');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: reference },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        webhookData: paymentData,
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' },
    });

    if (settings.escrowEnabled) {
      await this.createEscrow(payment.orderId, Number(payment.amount), provider);
    }

    return { success: true, paymentId: payment.id };
  }

  private async paystackVerify(reference: string, settings: any): Promise<any> {
    const config = settings.paystackConfig;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
      },
    });
    return response.json();
  }

  private async flutterwaveVerify(reference: string, settings: any): Promise<any> {
    const config = settings.flutterwaveConfig;
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
      },
    });
    return response.json();
  }

  async createEscrow(orderId: string, amount: number, provider: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { company: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.escrow.create({
      data: {
        orderId,
        amount,
        provider,
        status: 'held',
        description: `Escrow for Order ${order.orderNumber}`,
      },
    });
  }

  async releaseEscrow(escrowId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== 'held') {
      throw new BadRequestException('Escrow is not in held status');
    }

    return this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: 'released',
        releasedAt: new Date(),
        releasedTo: escrow.provider,
      },
    });
  }

  async handleWebhook(provider: string, payload: any) {
    if (provider === 'paystack') {
      const event = payload.event;
      const data = payload.data;

      if (event === 'charge.success') {
        await this.verifyPayment(data.reference);
      }
    } else if (provider === 'flutterwave') {
      const event = payload.event;
      const data = payload.data;

      if (event === 'charge.completed') {
        await this.verifyPayment(data.tx_ref);
      }
    }

    return { received: true };
  }

  async getPaymentByOrder(orderId: string) {
    return this.prisma.payment.findUnique({
      where: { orderId },
    });
  }

  async getEscrowByOrder(orderId: string) {
    return this.prisma.escrow.findUnique({
      where: { orderId },
    });
  }
}
