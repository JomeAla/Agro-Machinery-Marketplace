import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrisma = {
    categoryModel: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCategoryDto = {
      name: 'Tractors',
      slug: 'tractors',
      description: 'Agricultural tractors',
      parentId: null,
    };

    it('should throw ConflictException if slug already exists', async () => {
      const existing = { id: 'cat-1', slug: 'tractors' };
      mockPrisma.categoryModel.findFirst.mockResolvedValue(existing);

      await expect(service.create(createCategoryDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parent not found', async () => {
      mockPrisma.categoryModel.findFirst.mockResolvedValue(null);
      mockPrisma.categoryModel.findUnique.mockResolvedValue(null);

      const dtoWithParent = { ...createCategoryDto, parentId: 'parent-1' };
      await expect(service.create(dtoWithParent)).rejects.toThrow(NotFoundException);
    });

    it('should create category successfully', async () => {
      const category = {
        id: 'cat-1',
        name: 'Tractors',
        slug: 'tractors',
        description: 'Agricultural tractors',
      };

      mockPrisma.categoryModel.findFirst.mockResolvedValue(null);
      mockPrisma.categoryModel.findUnique.mockResolvedValue(null);
      mockPrisma.categoryModel.create.mockResolvedValue(category);

      const result = await service.create(createCategoryDto);

      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Tractors');
      expect(mockPrisma.categoryModel.create).toHaveBeenCalledWith({
        data: {
          name: 'Tractors',
          slug: 'tractors',
          description: 'Agricultural tractors',
          parentId: null,
        },
      });
    });

    it('should create subcategory with parent', async () => {
      const parent = { id: 'parent-1', name: 'Farm Equipment' };
      const subcategory = {
        id: 'sub-1',
        name: 'Tractors',
        slug: 'tractors',
        parentId: 'parent-1',
      };

      mockPrisma.categoryModel.findFirst.mockResolvedValue(null);
      mockPrisma.categoryModel.findUnique.mockResolvedValue(parent);
      mockPrisma.categoryModel.create.mockResolvedValue(subcategory);

      const dtoWithParent = { ...createCategoryDto, parentId: 'parent-1' };
      const result = await service.create(dtoWithParent);

      expect(result.parentId).toBe('parent-1');
    });
  });

  describe('findAll', () => {
    it('should return root categories with children and count', async () => {
      const categories = [
        { id: 'cat-1', name: 'Tractors', children: [], _count: { products: 5 } },
        { id: 'cat-2', name: 'Harvesters', children: [], _count: { products: 3 } },
      ];

      mockPrisma.categoryModel.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrisma.categoryModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: null },
          include: expect.objectContaining({
            children: true,
            _count: { select: { products: true } },
          }),
        })
      );
    });

    it('should order categories by name ascending', async () => {
      mockPrisma.categoryModel.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.categoryModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('findAllFlat', () => {
    it('should return all categories without hierarchy', async () => {
      const categories = [
        { id: 'cat-1', name: 'Tractors' },
        { id: 'cat-2', name: 'Harvesters' },
      ];

      mockPrisma.categoryModel.findMany.mockResolvedValue(categories);

      const result = await service.findAllFlat();

      expect(result).toHaveLength(2);
      expect(mockPrisma.categoryModel.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('should return category by id', async () => {
      const category = { id: 'cat-1', name: 'Tractors' };
      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);

      const result = await service.findById('cat-1');

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.categoryModel.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should include children, parent, products and count', async () => {
      const category = { id: 'cat-1', name: 'Tractors' };
      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);

      await service.findById('cat-1');

      expect(mockPrisma.categoryModel.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            children: true,
            parent: true,
            products: expect.any(Object),
            _count: { select: { products: true } },
          }),
        })
      );
    });
  });

  describe('findBySlug', () => {
    it('should return category by slug', async () => {
      const category = { id: 'cat-1', slug: 'tractors' };
      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);

      const result = await service.findBySlug('tractors');

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.categoryModel.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should include children, parent, products and count', async () => {
      const category = { id: 'cat-1', slug: 'tractors' };
      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);

      await service.findBySlug('tractors');

      expect(mockPrisma.categoryModel.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            children: true,
            parent: true,
            products: expect.any(Object),
            _count: { select: { products: true } },
          }),
        })
      );
    });
  });

  describe('update', () => {
    const updateCategoryDto = {
      name: 'Updated Tractors',
      description: 'Updated description',
    };

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.categoryModel.findUnique.mockResolvedValue(null);

      await expect(service.update('cat-1', updateCategoryDto)).rejects.toThrow(NotFoundException);
    });

    it('should update category successfully', async () => {
      const category = { id: 'cat-1', name: 'Tractors' };
      const updated = { ...category, ...updateCategoryDto };

      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);
      mockPrisma.categoryModel.update.mockResolvedValue(updated);

      const result = await service.update('cat-1', updateCategoryDto);

      expect(result.name).toBe('Updated Tractors');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.categoryModel.findUnique.mockResolvedValue(null);

      await expect(service.delete('cat-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if category has children', async () => {
      const category = {
        id: 'cat-1',
        children: [{ id: 'sub-1' }],
        products: [],
      };
      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);

      await expect(service.delete('cat-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if category has products', async () => {
      const category = {
        id: 'cat-1',
        children: [],
        products: [{ id: 'prod-1' }],
      };
      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);

      await expect(service.delete('cat-1')).rejects.toThrow(ConflictException);
    });

    it('should delete category successfully', async () => {
      const category = { id: 'cat-1', children: [], products: [] };
      mockPrisma.categoryModel.findUnique.mockResolvedValue(category);
      mockPrisma.categoryModel.delete.mockResolvedValue({ id: 'cat-1' });

      const result = await service.delete('cat-1');

      expect(result.message).toBe('Category deleted successfully');
      expect(mockPrisma.categoryModel.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });
  });
});