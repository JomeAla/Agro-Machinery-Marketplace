import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto, SellerResponseDto } from './dto/reviews.dto';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Verify user purchased the product (if orderId provided)
    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: dto.orderId,
          buyerId: userId,
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        },
      });

      if (!order) {
        throw new ForbiddenException('You can only review products you have purchased');
      }
    } else {
      // Check if user has any delivered order with this product
      const hasPurchased = await this.prisma.orderItem.findFirst({
        where: {
          productId: dto.productId,
          order: {
            buyerId: userId,
            status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
          },
        },
      });

      if (!hasPurchased) {
        throw new ForbiddenException('You can only review products you have purchased');
      }
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId: dto.productId,
        status: { not: ReviewStatus.DELETED },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        orderId: dto.orderId || null,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        status: ReviewStatus.PENDING, // Reviews need approval
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: { select: { avatar: true } },
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
    });
  }

  async findAll(query: ReviewQueryDto) {
    const { page = 1, limit = 10, status, productId } = query;

    const where: any = {
      status: ReviewStatus.APPROVED, // Only show approved reviews publicly
    };

    if (status) {
      where.status = status;
    }

    if (productId) {
      where.productId = productId;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profile: { select: { avatar: true } },
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
          votes: {
            take: 10,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: { productId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
    });

    return {
      reviews,
      averageRating: avgRating._avg.rating || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const where = {
      productId,
      status: ReviewStatus.APPROVED,
    };

    const [reviews, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profile: { select: { avatar: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { productId, status: ReviewStatus.APPROVED },
        _count: true,
      }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.forEach((s) => {
      ratingDistribution[s.rating as keyof typeof ratingDistribution] = s._count;
    });

    // Calculate average
    const avgResult = await this.prisma.review.aggregate({
      where: { productId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
    });

    return {
      reviews,
      averageRating: avgResult._avg.rating || 0,
      totalReviews: total,
      ratingDistribution,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: { select: { avatar: true } },
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
            company: { select: { id: true, name: true } },
          },
        },
        votes: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Can't update if already approved (would need re-approval)
    if (review.status === ReviewStatus.APPROVED) {
      throw new BadRequestException('Cannot update an approved review. Contact support.');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...dto,
        status: ReviewStatus.PENDING, // Re-submit for approval
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Soft delete
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.DELETED },
    });
  }

  async getMyReviews(userId: string, page = 1, limit = 10) {
    const where = { userId, status: { not: ReviewStatus.DELETED } };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              company: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async vote(reviewId: string, userId: string, helpful: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user already voted
    const existingVote = await this.prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.helpful === helpful) {
        return { message: 'Vote already recorded' };
      }

      // Update vote and adjust counts
      await this.prisma.$transaction([
        this.prisma.reviewVote.update({
          where: { id: existingVote.id },
          data: { helpful },
        }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: helpful ? { increment: 1 } : { decrement: 1 },
            notHelpfulCount: helpful ? { decrement: 1 } : { increment: 1 },
          },
        }),
      ]);

      return { message: 'Vote updated' };
    }

    // Create new vote
    await this.prisma.$transaction([
      this.prisma.reviewVote.create({
        data: {
          reviewId,
          userId,
          helpful,
        },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: helpful ? { increment: 1 } : undefined,
          notHelpfulCount: helpful ? undefined : { increment: 1 },
        },
      }),
    ]);

    return { message: 'Vote recorded' };
  }

  async sellerRespond(sellerId: string, reviewId: string, dto: SellerResponseDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { include: { company: true } } },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the product seller can respond
    if (review.product.sellerId !== sellerId) {
      throw new ForbiddenException('Only the product seller can respond to reviews');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerResponse: dto.response,
        sellerResponseAt: new Date(),
      },
    });
  }

  // Admin methods
  async findAllForAdmin(query: ReviewQueryDto) {
    const { page = 1, limit = 10, status, productId } = query;

    const where: any = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.APPROVED },
    });
  }

  async flagReview(reviewId: string, reason: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.FLAGGED,
        flaggedReason: reason,
      },
    });
  }
}