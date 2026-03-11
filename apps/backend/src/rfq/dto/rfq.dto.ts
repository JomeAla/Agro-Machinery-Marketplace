import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RfqStatus } from '@prisma/client';

export class CreateRfqDto {
  @ApiProperty({ example: 'Looking for 2 tractors for our farm' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'We need reliable tractors for 500 hectares of farmland...' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 30000000 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsDateString()
  @IsOptional()
  neededBy?: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  deliveryState?: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  deliveryCity?: string;
}

export class UpdateRfqDto {
  @ApiPropertyOptional({ example: 'Looking for 2 tractors' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 30000000 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsDateString()
  @IsOptional()
  neededBy?: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  deliveryState?: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  deliveryCity?: string;

  @ApiPropertyOptional({ enum: RfqStatus })
  @IsEnum(RfqStatus)
  @IsOptional()
  status?: RfqStatus;
}

export class CreateQuoteDto {
  @ApiProperty()
  @IsUUID()
  rfqId: string;

  @ApiProperty({ example: 25000000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsNumber()
  @IsOptional()
  freightCost?: number;

  @ApiPropertyOptional({ example: 'Includes delivery and training' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RfqQueryDto {
  @ApiPropertyOptional({ enum: RfqStatus })
  @IsEnum(RfqStatus)
  @IsOptional()
  status?: RfqStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  limit?: number;
}
