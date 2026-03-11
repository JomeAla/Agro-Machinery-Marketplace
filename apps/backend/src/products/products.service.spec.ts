import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, Condition } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProductDto = {
      title: 'John Deere Tractor',
      slug: 'john-deere-tractor',
      description: 'High performance tractor',
      price: 15000000,
      condition: Condition.NEW as any,
      categoryId: 'category-1',
      images: ['image1.jpg'],
      specs: { engine: '4-cylinder' },
    };

    it('should throw ForbiddenException if user has no company', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', companyId: null });

      await expect(service.create('user-1', createProductDto)).rejects.toThrow(ForbiddenException);
    });

    it('should create a product successfully', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const product = {
        id: 'product-1',
        ...createProductDto,
        sellerId: 'user-1',
        companyId: 'company-1',
        category: { id: 'category-1', name: 'Tractor', slug: 'tractor' },
        seller: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        company: { id: 'company-1', name: 'Test Company', isVerified: true },
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.create.mockResolvedValue(product);

      const result = await service.create('user-1', createProductDto);

      expect(result.id).toBe('product-1');
      expect(result.title).toBe(createProductDto.title);
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });

    it('should use default values for optional fields', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const productDto = {
        title: 'Test Product',
        slug: 'test-product',
        description: 'Description',
        price: 10000,
        condition: Condition.NEW as any,
        categoryId: 'category-1',
      };

      const product = {
        id: 'product-1',
        ...productDto,
        sellerId: 'user-1',
        companyId: 'company-1',
        images: [],
        specs: {},
        inStock: true,
        stockQuantity: 0,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.create.mockResolvedValue(product);

      const result = await service.create('user-1', productDto);

      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inStock: true,
            stockQuantity: 0,
            images: [],
            specs: {},
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        { id: 'product-1', title: 'Product 1', category: { id: 'cat-1', name: 'Tractor' } },
        { id: 'product-2', title: 'Product 2', category: { id: 'cat-1', name: 'Tractor' } },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.products).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by search query', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ search: 'tractor' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'tractor', mode: 'insensitive' } },
              { description: { contains: 'tractor', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should filter by category', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ category: 'tractors' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 'tractors' },
          }),
        })
      );
    });

    it('should filter by condition', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ condition: Condition.NEW as any });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            condition: Condition.NEW,
          }),
        })
      );
    });

    it('should filter by price range', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ minPrice: 1000000, maxPrice: 50000000 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 1000000, lte: 50000000 },
          }),
        })
      );
    });

    it('should filter by horsepower range', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ minHorsepower: 50, maxHorsepower: 200 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            horsepower: { gte: 50, lte: 200 },
          }),
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(20);

      await service.findAll({ page: 2, limit: 5 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });

    it('should return empty array when no products found', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.products).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      const product = { id: 'product-1', title: 'Test Product' };
      mockPrisma.product.findUnique.mockResolvedValue(product);

      const result = await service.findById('product-1');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      const product = { id: 'product-1', slug: 'test-product' };
      mockPrisma.product.findUnique.mockResolvedValue(product);

      const result = await service.findBySlug('test-product');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { title: 'Updated Title', price: 20000000 };

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('user-1', 'product-1', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'product-1', sellerId: 'other-user' });

      await expect(service.update('user-1', 'product-1', updateDto)).rejects.toThrow(ForbiddenException);
    });

    it('should update product successfully', async () => {
      const product = { id: 'product-1', sellerId: 'user-1', ...updateDto };
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'product-1', sellerId: 'user-1' });
      mockPrisma.product.update.mockResolvedValue(product);

      const result = await service.update('user-1', 'product-1', updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(mockPrisma.product.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'product-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'product-1', sellerId: 'other-user' });

      await expect(service.delete('user-1', 'product-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete product successfully', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'product-1', sellerId: 'user-1' });
      mockPrisma.product.delete.mockResolvedValue({ id: 'product-1' });

      const result = await service.delete('user-1', 'product-1');

      expect(result.message).toBe('Product deleted successfully');
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: 'product-1' } });
    });
  });

  describe('getMyProducts', () => {
    it('should return products for a specific seller', async () => {
      const products = [{ id: 'product-1' }, { id: 'product-2' }];
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.getMyProducts('user-1');

      expect(result.products).toHaveLength(2);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sellerId: 'user-1' },
        })
      );
    });

    it('should apply pagination', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(10);

      await service.getMyProducts('user-1', 2, 5);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('findByCompany', () => {
    it('should return products for a specific company', async () => {
      const products = [{ id: 'product-1', companyId: 'company-1' }];
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await service.findByCompany('company-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});