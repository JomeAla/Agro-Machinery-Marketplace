import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    categoryModel: {
      findMany: jest.fn(),
    },
    company: {
      update: jest.fn(),
    },
    dropshipProduct: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100)  // totalUsers
        .mockResolvedValueOnce(60)   // totalBuyers
        .mockResolvedValueOnce(40);  // totalSellers
      mockPrisma.order.count.mockResolvedValue(50);
      mockPrisma.product.count
        .mockResolvedValueOnce(30)   // totalProducts
        .mockResolvedValueOnce(10)   // pendingProducts
        .mockResolvedValueOnce(25);  // activeProducts
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 5000000 } });
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.order.groupBy.mockResolvedValue([]);
      mockPrisma.product.groupBy.mockResolvedValue([]);
      mockPrisma.categoryModel.findMany.mockResolvedValue([]);

      const result = await service.getAnalytics();

      expect(result.totalUsers).toBe(100);
      expect(result.totalBuyers).toBe(60);
      expect(result.totalSellers).toBe(40);
      expect(result.totalOrders).toBe(50);
      expect(result.totalProducts).toBe(30);
      expect(result.pendingProducts).toBe(10);
      expect(result.activeProducts).toBe(25);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: 'user-1', email: 'user1@example.com', role: Role.BUYER },
        { id: 'user-2', email: 'user2@example.com', role: Role.SELLER },
      ];

      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(2);

      const result = await service.getUsers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter users by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({ role: 'BUYER' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'BUYER' }),
        })
      );
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      const user = { id: 'user-1', isActive: true };
      const updated = { ...user, isActive: false };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.updateUserStatus('user-1', { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserStatus('non-existent', { isActive: false })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    it('should create user', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: Role.BUYER,
      };

      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', ...createDto, password: 'hashed' });

      const result = await service.createUser(createDto);

      expect(result.id).toBe('user-1');
    });
  });

  describe('deleteUser', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const products = [{ id: 'prod-1', title: 'Tractor' }];
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.getProducts({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('flagProduct', () => {
    it('should flag product', async () => {
      const product = { id: 'prod-1', status: 'APPROVED' };
      const updated = { ...product, status: 'FLAGGED', rejectionReason: 'Policy violation' };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.product.update.mockResolvedValue(updated);

      const result = await service.flagProduct('prod-1', 'Policy violation');

      expect(result.status).toBe('FLAGGED');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.flagProduct('non-existent', 'Reason')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProduct', () => {
    it('should throw BadRequestException if product has orders', async () => {
      const product = { id: 'prod-1', orderItems: [{ id: 'order-1' }] };
      mockPrisma.product.findUnique.mockResolvedValue(product);

      await expect(service.deleteProduct('prod-1')).rejects.toThrow(BadRequestException);
    });

    it('should delete product successfully', async () => {
      const product = { id: 'prod-1', orderItems: [] };
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.dropshipProduct.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.product.delete.mockResolvedValue(product);

      const result = await service.deleteProduct('prod-1');

      expect(result.id).toBe('prod-1');
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const orders = [{ id: 'order-1', orderNumber: 'ORD001' }];
      mockPrisma.order.findMany.mockResolvedValue(orders);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await service.getOrders({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
    });
  });
});