import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VehicleType {
  LOWBED = 'lowbed',
  FLATBED = 'flatbed',
  TRUCK = 'truck',
  PICKUP = 'pickup',
}

export class CalculateFreightDto {
  @ApiProperty({ example: 'Kano' })
  @IsString()
  originState: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  destinationState: string;

  @ApiProperty({ enum: VehicleType, example: 'lowbed' })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  units?: number;
}

export class CreateFreightQuoteDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'Kano' })
  @IsString()
  originState: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  destinationState: string;

  @ApiProperty({ enum: VehicleType, example: 'lowbed' })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiPropertyOptional({ example: '3-5 days delivery' })
  @IsString()
  @IsOptional()
  estimatedDays?: string;

  @ApiPropertyOptional({ example: 'Includes loading and offloading' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFreightStatusDto {
  @ApiProperty({ example: 'in_transit' })
  @IsString()
  status: string;
}

export class NigerianStateDto {
  @ApiProperty({ example: 'Lagos' })
  name: string;

  @ApiProperty({ example: 'LA' })
  code: string;

  @ApiProperty({ example: 'Ikeja' })
  capital: string;

  @ApiProperty({ example: 'South West' })
  region: string;
}
