import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFinancingRequestDto {
  @ApiProperty({ example: 'INSTALLMENT' })
  @IsString()
  financingType: string;

  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10000000 })
  @IsNumber()
  @Min(100000)
  amount: number;

  @ApiProperty({ example: 36 })
  @IsNumber()
  @Min(6)
  @Max(60)
  tenureMonths: number;

  @ApiProperty({ example: 'We need financing for 2 tractors for our cooperative farm...' })
  @IsString()
  purpose: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  city?: string;
}

export class FinancingQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class UpdateFinancingStatusDto {
  @ApiProperty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Additional documentation required' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CalculateInstallmentDto {
  @ApiProperty({ example: 10000000 })
  @IsNumber()
  @Min(100000)
  amount: number;

  @ApiProperty({ example: 36 })
  @IsNumber()
  @Min(6)
  @Max(60)
  tenureMonths: number;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  interestRate?: number;
}
