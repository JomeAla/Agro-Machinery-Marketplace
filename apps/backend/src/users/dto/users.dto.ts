import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Experienced farmer with 50 hectares' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: '123 Farm Road' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Kano' })
  @IsString()
  @IsOptional()
  state?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123', minLength: 8 })
  @IsString()
  @Min(8)
  newPassword: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Green Farms Ltd' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'BN-1234567' })
  @IsString()
  @IsOptional()
  cacNumber?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cac.pdf' })
  @IsString()
  @IsOptional()
  cacDocument?: string;

  @ApiPropertyOptional({ example: 'Expert in rice and cassava' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://greenfarms.ng' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: 'office@greenfarms.ng' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+2347012345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Business Way' })
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
}
