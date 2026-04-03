import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  DELETED = 'DELETED',
}

export class CreateReviewDto {
  @ApiProperty({ example: 'uuid-product-id' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-order-id' })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great tractor, highly recommended!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'I have been using this tractor for 6 months now...' })
  @IsString()
  comment: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated comment' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @ApiPropertyOptional({ example: 'uuid-product-id' })
  @IsUUID()
  @IsOptional()
  productId?: string;
}

export class SellerResponseDto {
  @ApiProperty({ example: 'Thank you for your feedback!' })
  @IsString()
  response: string;
}

export class VoteReviewDto {
  @ApiProperty({ example: true })
  @IsNumber()
  helpful: boolean;
}