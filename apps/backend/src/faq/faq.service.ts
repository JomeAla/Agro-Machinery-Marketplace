import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  // ==================== Categories ====================

  async getCategories() {
    return this.prisma.faqCategory.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.faqCategory.findUnique({
      where: { id },
      include: { articles: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(data: { name: string; slug: string; description?: string; order?: number }) {
    return this.prisma.faqCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        order: data.order || 0,
      },
    });
  }

  async updateCategory(id: string, data: { name?: string; slug?: string; description?: string; order?: number }) {
    const category = await this.prisma.faqCategory.findUnique({ where: { id } });
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.faqCategory.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        order: data.order,
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.faqCategory.findUnique({ where: { id } });
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.faqCategory.delete({ where: { id } });
  }

  // ==================== Articles ====================

  async getArticles(params: { categoryId?: string; published?: boolean; search?: string }) {
    const where: any = {};

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.published !== undefined) {
      where.published = params.published;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.faqArticle.findMany({
      where,
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  async getArticleById(id: string) {
    const article = await this.prisma.faqArticle.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async getPublishedArticles() {
    return this.prisma.faqArticle.findMany({
      where: { published: true },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  async createArticle(data: {
    title: string;
    slug: string;
    content: string;
    categoryId: string;
    order?: number;
    published?: boolean;
  }) {
    return this.prisma.faqArticle.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        categoryId: data.categoryId,
        order: data.order || 0,
        published: data.published || false,
      },
    });
  }

  async updateArticle(id: string, data: {
    title?: string;
    slug?: string;
    content?: string;
    categoryId?: string;
    order?: number;
    published?: boolean;
  }) {
    const article = await this.prisma.faqArticle.findUnique({ where: { id } });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.faqArticle.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        categoryId: data.categoryId,
        order: data.order,
        published: data.published,
      },
    });
  }

  async deleteArticle(id: string) {
    const article = await this.prisma.faqArticle.findUnique({ where: { id } });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.faqArticle.delete({ where: { id } });
  }

  // ==================== Voting ====================

  async voteArticle(articleId: string, userId: string, helpful: boolean) {
    const article = await this.prisma.faqArticle.findUnique({ where: { id: articleId } });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existingVote = await this.prisma.faqVote.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.helpful === helpful) {
        return { message: 'Vote already recorded' };
      }

      await this.prisma.$transaction([
        this.prisma.faqVote.update({
          where: { id: existingVote.id },
          data: { helpful },
        }),
        this.prisma.faqArticle.update({
          where: { id: articleId },
          data: {
            helpfulCount: helpful ? { increment: 1 } : { decrement: 1 },
            notHelpfulCount: helpful ? { decrement: 1 } : { increment: 1 },
          },
        }),
      ]);

      return { message: 'Vote updated' };
    }

    await this.prisma.$transaction([
      this.prisma.faqVote.create({
        data: {
          userId,
          articleId,
          helpful,
        },
      }),
      this.prisma.faqArticle.update({
        where: { id: articleId },
        data: {
          helpfulCount: helpful ? { increment: 1 } : undefined,
          notHelpfulCount: helpful ? undefined : { increment: 1 },
        },
      }),
    ]);

    return { message: 'Vote recorded' };
  }

  async getUserVote(articleId: string, userId: string) {
    const vote = await this.prisma.faqVote.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    return vote;
  }
}
