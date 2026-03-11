import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/products.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProductDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      throw new ForbiddenException('Only sellers with companies can create products');
    }

    return this.prisma.product.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        condition: dto.condition,
        horsepower: dto.horsepower,
        warrantyMonths: dto.warrantyMonths,
        images: dto.images || [],
        specs: dto.specs || {},
        inStock: dto.inStock ?? true,
        stockQuantity: dto.stockQuantity ?? 0,
        categoryId: dto.categoryId,
        sellerId: userId,
        companyId: user.companyId,
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            isVerified: true,
          },
        },
      },
    });
  }

  async findAll(query: ProductQueryDto) {
    const { search, category, condition, minPrice, maxPrice, minHorsepower, maxHorsepower, page = 1, limit = 12 } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (condition) {
      where.condition = condition;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    if (minHorsepower || maxHorsepower) {
      where.horsepower = {};
      if (minHorsepower) where.horsepower.gte = minHorsepower;
      if (maxHorsepower) where.horsepower.lte = maxHorsepower;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          company: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              logo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        company: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        manuals: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        company: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        manuals: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own products');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
      include: {
        category: true,
        company: {
          select: {
            id: true,
            name: true,
            isVerified: true,
          },
        },
      },
    });
  }

  async delete(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }

  async getMyProducts(userId: string, page = 1, limit = 10) {
    const where = { sellerId: userId };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCompany(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
