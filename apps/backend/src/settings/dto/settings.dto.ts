import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentGatewayConfigDto {
  @ApiProperty({ example: 'PAYSTACK' })
  @IsString()
  provider: string;

  @ApiProperty()
  @IsString()
  secretKey: string;

  @ApiProperty()
  @IsString()
  publicKey: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({ example: 'PAYSTACK' })
  @IsString()
  @IsOptional()
  paymentProvider?: string;

  @ApiPropertyOptional({ type: PaymentGatewayConfigDto })
  @IsOptional()
  paystackConfig?: PaymentGatewayConfigDto;

  @ApiPropertyOptional({ type: PaymentGatewayConfigDto })
  @IsOptional()
  flutterwaveConfig?: PaymentGatewayConfigDto;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  escrowEnabled?: boolean;

  @ApiPropertyOptional({ example: 2.5 })
  @IsNumber()
  @IsOptional()
  platformFeePercent?: number;

  @ApiPropertyOptional({ example: 'support@agromarket.ng' })
  @IsString()
  @IsOptional()
  supportEmail?: string;
}

export class InitializePaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ example: 15000000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'NGN' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'buyer@example.com' })
  @IsString()
  customerEmail: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  customerPhone?: string;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  reference: string;
}

export class CreateEscrowDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ example: 15000000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Tractor purchase - John Deere 5R' })
  @IsString()
  description: string;
}

export class ReleaseEscrowDto {
  @ApiProperty()
  @IsString()
  escrowId: string;
}
