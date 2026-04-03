import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComparisonService {
  constructor(private prisma: PrismaService) {}

  async addToComparison(userId: string, productId: string) {
    let comparison = await this.prisma.productComparison.findFirst({
      where: { userId },
      include: { products: true },
    });

    if (!comparison) {
      comparison = await this.prisma.productComparison.create({
        data: { userId },
        include: { products: true },
      });
    }

    const existingProduct = comparison.products.find(p => p.id === productId);
    if (existingProduct) {
      return comparison;
    }

    if (comparison.products.length >= 4) {
      return { error: 'Maximum 4 products can be compared at once' };
    }

    return this.prisma.productComparison.update({
      where: { id: comparison.id },
      data: { products: { connect: { id: productId } } },
      include: { products: true },
    });
  }

  async removeFromComparison(userId: string, productId: string) {
    const comparison = await this.prisma.productComparison.findFirst({
      where: { userId },
      include: { products: true },
    });

    if (!comparison) {
      return { message: 'No comparison list found' };
    }

    return this.prisma.productComparison.update({
      where: { id: comparison.id },
      data: { products: { disconnect: { id: productId } } },
      include: { products: true },
    });
  }

  async getMyComparison(userId: string) {
    const comparison = await this.prisma.productComparison.findFirst({
      where: { userId },
      include: {
        products: {
          include: {
            category: true,
            seller: { include: { company: true } },
            reviews: true,
          },
        },
      },
    });

    if (!comparison) {
      return { products: [] };
    }

    return comparison;
  }

  async clearComparison(userId: string) {
    const comparison = await this.prisma.productComparison.findFirst({
      where: { userId },
    });

    if (!comparison) {
      return { message: 'No comparison list found' };
    }

    return this.prisma.productComparison.update({
      where: { id: comparison.id },
      data: { products: { set: [] } },
      include: { products: true },
    });
  }

  async getComparisonDetails(userId: string, productIds: string[]) {
    return this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        seller: { include: { company: true } },
        reviews: true,
      },
    });
  }
}
