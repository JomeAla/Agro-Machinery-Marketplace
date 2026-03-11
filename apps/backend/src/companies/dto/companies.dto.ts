import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Doe Farms Limited' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'RC1234567' })
  @IsString()
  @IsOptional()
  cacNumber?: string;

  @ApiPropertyOptional({ example: 'Leading agricultural machinery dealer' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: '123 Business Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'https://doefarms.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@doefarms.com' })
  @IsString()
  @IsOptional()
  email?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Doe Farms Limited' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Leading agricultural machinery dealer' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: '123 Business Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'https://doefarms.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@doefarms.com' })
  @IsString()
  @IsOptional()
  email?: string;
}

export class VerifyCompanyDto {
  @ApiProperty()
  @IsBoolean()
  isVerified: boolean;
}
