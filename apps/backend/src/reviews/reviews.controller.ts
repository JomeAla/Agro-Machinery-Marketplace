import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto, SellerResponseDto, VoteReviewDto } from './dto/reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a product' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approved reviews (public)' })
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  async getMyReviews(@Request() req, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.reviewsService.getMyReviews(req.user.id, Number(page), Number(limit));
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get reviews for a specific product' })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ) {
    return this.reviewsService.findByProduct(productId, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single review by ID' })
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own review' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.reviewsService.delete(req.user.id, id);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a review (helpful/not helpful)' })
  async vote(@Request() req, @Param('id') id: string, @Body() dto: VoteReviewDto) {
    return this.reviewsService.vote(id, req.user.id, dto.helpful);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller responds to a review' })
  async sellerRespond(@Request() req, @Param('id') id: string, @Body() dto: SellerResponseDto) {
    return this.reviewsService.sellerRespond(req.user.id, id, dto);
  }
}

// Admin Controller
@ApiTags('Admin - Reviews')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all reviews' })
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewsService.findAllForAdmin(query);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Admin: Approve a review' })
  async approve(@Param('id') id: string) {
    return this.reviewsService.approveReview(id);
  }

  @Post(':id/flag')
  @ApiOperation({ summary: 'Admin: Flag a review' })
  async flag(@Param('id') id: string, @Body('reason') reason: string) {
    return this.reviewsService.flagReview(id, reason);
  }
}