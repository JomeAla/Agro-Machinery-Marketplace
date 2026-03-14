import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlatformSettingsDto, PaymentGatewayConfigDto } from './dto/settings.dto';

const PaymentProvider = {
  PAYSTACK: 'PAYSTACK',
  FLUTTERWAVE: 'FLUTTERWAVE'
} as const;

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.platformSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.platformSettings.create({
        data: {
          paymentProvider: PaymentProvider.PAYSTACK,
          escrowEnabled: true,
          platformFeePercent: 2.5,
        },
      });
    }

    const { paystackSecretKey, paystackPublicKey, flutterwaveSecretKey, flutterwavePublicKey, ...publicSettings } = settings as any;
    const paystackCfg = settings.paystackConfig as any;
    const flutterwaveCfg = settings.flutterwaveConfig as any;

    return {
      ...publicSettings,
      paystackConfig: settings.paystackConfig ? {
        provider: 'paystack',
        isActive: paystackCfg?.isActive || false,
        secretKey: paystackCfg?.secretKey || null,
      } : null,
      flutterwaveConfig: settings.flutterwaveConfig ? {
        provider: 'flutterwave',
        isActive: flutterwaveCfg?.isActive || false,
        secretKey: flutterwaveCfg?.secretKey || null,
      } : null,
    };
  }

  async updateSettings(dto: UpdatePlatformSettingsDto) {
    const existing = await this.prisma.platformSettings.findFirst();
    
    const updateData: any = {};
    
    if (dto.paymentProvider) {
      updateData.paymentProvider = dto.paymentProvider;
    }
    
    if (dto.escrowEnabled !== undefined) {
      updateData.escrowEnabled = dto.escrowEnabled;
    }
    
    if (dto.platformFeePercent) {
      updateData.platformFeePercent = dto.platformFeePercent;
    }
    
    if (dto.supportEmail) {
      updateData.supportEmail = dto.supportEmail;
    }

    if (dto.paystackConfig) {
      updateData.paystackConfig = {
        secretKey: dto.paystackConfig.secretKey,
        publicKey: dto.paystackConfig.publicKey,
        webhookSecret: dto.paystackConfig.webhookSecret,
        isActive: dto.paystackConfig.isActive,
      };
    }

    if (dto.flutterwaveConfig) {
      updateData.flutterwaveConfig = {
        secretKey: dto.flutterwaveConfig.secretKey,
        publicKey: dto.flutterwaveConfig.publicKey,
        webhookSecret: dto.flutterwaveConfig.webhookSecret,
        isActive: dto.flutterwaveConfig.isActive,
      };
    }

    if (existing) {
      return this.prisma.platformSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      return this.prisma.platformSettings.create({
        data: {
          paymentProvider: dto.paymentProvider || PaymentProvider.PAYSTACK,
          escrowEnabled: dto.escrowEnabled ?? true,
          platformFeePercent: dto.platformFeePercent ?? 2.5,
          ...updateData,
        },
      });
    }
  }

  async getActivePaymentProvider() {
    const settings = await this.getSettings();
    return settings.paymentProvider;
  }
}
