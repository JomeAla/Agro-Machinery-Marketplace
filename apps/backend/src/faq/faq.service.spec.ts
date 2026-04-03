import { Test, TestingModule } from '@nestjs/testing';
import { FaqService } from './faq.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FaqService', () => {
  let service: FaqService;
  let prisma: PrismaService;

  const mockPrisma = {
    faqCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    faqArticle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    faqVote: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([{}, {}]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaqService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FaqService>(FaqService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return all categories ordered by order', async () => {
      const categories = [{ id: 'cat-1', name: 'Payments' }, { id: 'cat-2', name: 'Shipping' }];
      mockPrisma.faqCategory.findMany.mockResolvedValue(categories);

      const result = await service.getCategories();

      expect(result).toHaveLength(2);
      expect(mockPrisma.faqCategory.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      const category = { id: 'cat-1', name: 'Payments', articles: [] };
      mockPrisma.faqCategory.findUnique.mockResolvedValue(category);

      const result = await service.getCategoryById('cat-1');

      expect(result.id).toBe('cat-1');
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.faqCategory.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCategory', () => {
    it('should create category', async () => {
      const data = { name: 'New Category', slug: 'new-category', description: 'Test description' };
      const category = { id: 'cat-1', ...data };

      mockPrisma.faqCategory.create.mockResolvedValue(category);

      const result = await service.createCategory(data);

      expect(result.id).toBe('cat-1');
    });
  });

  describe('updateCategory', () => {
    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.faqCategory.findUnique.mockResolvedValue(null);

      await expect(service.updateCategory('non-existent', { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('should update category', async () => {
      const category = { id: 'cat-1', name: 'Old Name' };
      const updated = { ...category, name: 'New Name' };

      mockPrisma.faqCategory.findUnique.mockResolvedValue(category);
      mockPrisma.faqCategory.update.mockResolvedValue(updated);

      const result = await service.updateCategory('cat-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      const category = { id: 'cat-1', name: 'Category' };
      mockPrisma.faqCategory.findUnique.mockResolvedValue(category);
      mockPrisma.faqCategory.delete.mockResolvedValue(category);

      const result = await service.deleteCategory('cat-1');

      expect(result).toBeDefined();
    });
  });

  describe('getArticles', () => {
    it('should return articles with filters', async () => {
      const articles = [{ id: 'art-1', title: 'How to pay?' }];
      mockPrisma.faqArticle.findMany.mockResolvedValue(articles);

      const result = await service.getArticles({ published: true });

      expect(result).toHaveLength(1);
    });

    it('should filter by category', async () => {
      mockPrisma.faqArticle.findMany.mockResolvedValue([]);

      await service.getArticles({ categoryId: 'cat-1' });

      expect(mockPrisma.faqArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        })
      );
    });
  });

  describe('getArticleById', () => {
    it('should return article by id', async () => {
      const article = { id: 'art-1', title: 'How to pay?' };
      mockPrisma.faqArticle.findUnique.mockResolvedValue(article);

      const result = await service.getArticleById('art-1');

      expect(result.title).toBe('How to pay?');
    });

    it('should throw NotFoundException if article not found', async () => {
      mockPrisma.faqArticle.findUnique.mockResolvedValue(null);

      await expect(service.getArticleById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createArticle', () => {
    it('should create article', async () => {
      const data = { title: 'New Article', slug: 'new-article', content: 'Content here', categoryId: 'cat-1' };
      const article = { id: 'art-1', ...data, published: false };

      mockPrisma.faqArticle.create.mockResolvedValue(article);

      const result = await service.createArticle(data);

      expect(result.id).toBe('art-1');
    });
  });

  describe('voteArticle', () => {
    it('should increment helpful count', async () => {
      const article = { id: 'art-1', helpfulCount: 5 };
      mockPrisma.faqArticle.findUnique.mockResolvedValue(article);
      mockPrisma.faqVote.findUnique.mockResolvedValue(null);
      mockPrisma.faqVote.create.mockResolvedValue({});
      mockPrisma.faqArticle.update.mockResolvedValue({ ...article, helpfulCount: 6 });

      const result = await service.voteArticle('art-1', 'user-1', true);

      expect(result).toBeDefined();
    });

    it('should not allow duplicate voting', async () => {
      const existingVote = { id: 'vote-1', helpful: true };
      mockPrisma.faqVote.findUnique.mockResolvedValue(existingVote);

      const result = await service.voteArticle('art-1', 'user-1', true);

      expect(result.message).toBe('Vote already recorded');
    });
  });
});