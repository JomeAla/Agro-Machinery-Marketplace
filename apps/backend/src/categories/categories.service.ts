import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.categoryModel.findFirst({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    if (dto.parentId) {
      const parent = await this.prisma.categoryModel.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.categoryModel.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        parentId: dto.parentId,
      },
    });
  }

  async findAll() {
    return this.prisma.categoryModel.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllFlat() {
    return this.prisma.categoryModel.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.categoryModel.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.categoryModel.findUnique({
      where: { slug },
      include: {
        children: true,
        parent: true,
        products: {
          take: 12,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.categoryModel.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.categoryModel.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const category = await this.prisma.categoryModel.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children.length > 0 || category.products.length > 0) {
      throw new ConflictException('Cannot delete category with children or products');
    }

    await this.prisma.categoryModel.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
