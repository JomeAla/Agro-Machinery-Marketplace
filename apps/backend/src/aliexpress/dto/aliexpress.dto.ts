import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AliExpressCredentialsDto {
  @ApiProperty({ example: 'your_app_key' })
  @IsString()
  appKey: string;

  @ApiProperty({ example: 'your_app_secret' })
  @IsString()
  appSecret: string;
}

export class AliExpressSearchDto {
  @ApiProperty({ example: 'tractor' })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'NG' })
  @IsString()
  @IsOptional()
  shipTo?: string;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;
}

export class ImportProductsDto {
  @ApiProperty({ example: ['1005004043442825'] })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @ApiPropertyOptional({ example: 'cat-uuid-here' })
  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class UpdateDraftDto {
  @ApiPropertyOptional({ example: 'Updated Product Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 50000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: ['https://example.com/image.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: 'cat-uuid-here' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  inStock?: boolean;
}
