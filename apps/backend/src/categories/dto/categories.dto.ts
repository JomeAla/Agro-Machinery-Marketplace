import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Tractors' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'tractors' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Agricultural tractors for farming' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Tractors' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Agricultural tractors for farming' })
  @IsString()
  @IsOptional()
  description?: string;
}
