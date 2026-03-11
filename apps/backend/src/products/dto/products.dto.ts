import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Condition, Category } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'John Deere 5R Series Tractor' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'john-deere-5r-series-tractor' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'High-performance tractor with 110 HP engine...' })
  @IsString()
  description: string;

  @ApiProperty({ example: 15000000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: Condition, example: 'NEW' })
  @IsEnum(Condition)
  condition: Condition;

  @ApiPropertyOptional({ example: 110 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  horsepower?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  warrantyMonths?: number;

  @ApiPropertyOptional({ example: ['https://example.com/tractor1.jpg'] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: { engine: '4-cylinder', transmission: '24x24' } })
  @IsOptional()
  specs?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty()
  @IsString()
  categoryId: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'John Deere 5R Series Tractor' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'High-performance tractor with 110 HP engine...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 15000000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: Condition })
  @IsEnum(Condition)
  @IsOptional()
  condition?: Condition;

  @ApiPropertyOptional({ example: 110 })
  @IsNumber()
  @IsOptional()
  horsepower?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsNumber()
  @IsOptional()
  warrantyMonths?: number;

  @ApiPropertyOptional({ example: ['https://example.com/tractor1.jpg'] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  specs?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}

export class ProductQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: Category })
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiPropertyOptional({ enum: Condition })
  @IsEnum(Condition)
  @IsOptional()
  condition?: Condition;

  @ApiPropertyOptional({ example: 1000000 })
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ example: 50000000 })
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsOptional()
  minHorsepower?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  maxHorsepower?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
