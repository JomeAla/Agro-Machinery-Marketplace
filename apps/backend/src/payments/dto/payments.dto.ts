import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
