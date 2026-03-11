import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  SERVICE = 'service',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateManualDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'Operator Manual' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'https://storage.example.com/manual.pdf' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  fileType: string;
}

export class CreateMaintenanceScheduleDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'Oil Change' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Regular oil change every 250 hours of operation' })
  @IsString()
  description: string;

  @ApiProperty({ enum: MaintenanceType, example: 'routine' })
  @IsEnum(MaintenanceType)
  maintenanceType: MaintenanceType;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Min(1)
  intervalHours: number;

  @ApiPropertyOptional({ example: 'Use SAE 15W-40 engine oil' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateMaintenanceRecordDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  scheduleId: string;

  @ApiProperty({ enum: MaintenanceType, example: 'routine' })
  @IsEnum(MaintenanceType)
  maintenanceType: MaintenanceType;

  @ApiProperty({ example: 'Completed oil change and filter replacement' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  performedAt: string;

  @ApiPropertyOptional({ example: 'John Workshop - 08012345678' })
  @IsString()
  @IsOptional()
  serviceProvider?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  cost?: number;
}

export class CreateWarrantyClaimDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'Engine overheating after 2 months' })
  @IsString()
  issue: string;

  @ApiProperty({ example: 'The tractor started overheating during normal operation...' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'https://example.com/issue-photo.jpg' })
  @IsArray()
  @IsOptional()
  images?: string[];
}

export class UpdateWarrantyClaimDto {
  @ApiProperty({ example: 'approved' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Issue covered under warranty' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
