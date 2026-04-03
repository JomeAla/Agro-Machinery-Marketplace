import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { FreightService } from '../freight/freight.service';
import { PaymentsService } from '../payments/payments.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderStatus, Role, Condition } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let promotions: PromotionsService;
  let freight: FreightService;
  let payments: PaymentsService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    discountCode: {
      update: jest.fn(),
    },
    escrow: {
      findUnique: jest.fn(),
    },
  };

  const mockPromotions = {
    validateDiscountCode: jest.fn(),
  };

  const mockFreight = {
    calculateFreight: jest.fn(),
  };

  const mockPayments = {
    releaseEscrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PromotionsService, useValue: mockPromotions },
        { provide: FreightService, useValue: mockFreight },
        { provide: PaymentsService, useValue: mockPayments },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    promotions = module.get<PromotionsService>(PromotionsService);
    freight = module.get<FreightService>(FreightService);
    payments = module.get<PaymentsService>(PaymentsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createOrderDto = {
      items: [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ],
      shippingAddress: '123 Test Street',
      shippingState: 'Lagos',
      notes: 'Please deliver during business hours',
      discountCode: 'SAVE10',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', createOrderDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if products not available', async () => {
      const user = { id: 'user-1', companyId: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.findMany.mockResolvedValue([]);

      await expect(service.create('user-1', createOrderDto)).rejects.toThrow(BadRequestException);
    });

    it('should create order successfully without discount code', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const products = [
        { id: 'product-1', price: 1000000, companyId: 'company-1' },
        { id: 'product-2', price: 500000, companyId: 'company-1' },
      ];
      const company = { id: 'company-1', state: 'Kano' };
      const order = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        buyerId: 'user-1',
        status: OrderStatus.PENDING,
        items: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockFreight.calculateFreight.mockReturnValue({ estimatedCost: 50000 });
      mockPrisma.order.create.mockResolvedValue(order);

      const dtoWithoutDiscount = { ...createOrderDto, discountCode: undefined };
      const result = await service.create('user-1', dtoWithoutDiscount);

      expect(result.id).toBe('order-1');
      expect(mockPromotions.validateDiscountCode).not.toHaveBeenCalled();
    });

    it('should create order successfully with discount code', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const products = [
        { id: 'product-1', price: 1000000, companyId: 'company-1' },
        { id: 'product-2', price: 500000, companyId: 'company-1' },
      ];
      const company = { id: 'company-1', state: 'Kano' };
      const order = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        buyerId: 'user-1',
        subtotal: 2500000,
        discountAmount: 250000,
        freightCost: 50000,
        total: 2250000,
        status: OrderStatus.PENDING,
        items: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockFreight.calculateFreight.mockReturnValue({ estimatedCost: 50000 });
      mockPromotions.validateDiscountCode.mockResolvedValue({ valid: true, discountAmount: 250000 });
      mockPrisma.order.create.mockResolvedValue(order);

      const result = await service.create('user-1', createOrderDto);

      expect(result.subtotal).toBe(2500000);
      expect(mockPromotions.validateDiscountCode).toHaveBeenCalledWith('SAVE10', 2500000);
      expect(mockPrisma.discountCode.update).toHaveBeenCalled();
    });

    it('should calculate freight when shipping state provided', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const products = [
        { id: 'product-1', price: 1000000, companyId: 'company-1' },
      ];
      const company = { id: 'company-1', state: 'Kano' };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockFreight.calculateFreight.mockReturnValue({ estimatedCost: 75000 });

      const dto = {
        items: [{ productId: 'product-1', quantity: 1 }],
        shippingState: 'Lagos',
      };

      await service.create('user-1', dto);

      expect(mockFreight.calculateFreight).toHaveBeenCalledWith({
        originState: 'Kano',
        destinationState: 'Lagos',
        vehicleType: 'pickup',
        units: 1,
      });
    });

    it('should handle empty shipping state (no freight)', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const products = [
        { id: 'product-1', price: 1000000, companyId: 'company-1' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.findMany.mockResolvedValue(products);

      const dto = {
        items: [{ productId: 'product-1', quantity: 1 }],
        shippingState: undefined,
      };

      await service.create('user-1', dto);

      expect(mockFreight.calculateFreight).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all orders with pagination', async () => {
      const mockOrders = [
        { id: 'order-1', orderNumber: 'ORD001', status: OrderStatus.PENDING },
        { id: 'order-2', orderNumber: 'ORD002', status: OrderStatus.PAID },
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.orders).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter orders by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll({ status: OrderStatus.PENDING });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING,
          }),
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(20);

      await service.findAll({ page: 2, limit: 5 });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });

    it('should return empty array when no orders found', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.orders).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return order by id', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001' };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findById('order-1');

      expect(result).toEqual(order);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should include related data (items, buyer, company, payment)', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001' };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await service.findById('order-1');

      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            items: expect.any(Object),
            buyer: expect.any(Object),
            company: true,
            payment: true,
          }),
        })
      );
    });
  });

  describe('getMyOrders', () => {
    it('should return buyer orders with pagination', async () => {
      const orders = [{ id: 'order-1' }, { id: 'order-2' }];

      mockPrisma.order.findMany.mockResolvedValue(orders);
      mockPrisma.order.count.mockResolvedValue(2);

      const result = await service.getMyOrders('user-1', 1, 10);

      expect(result.orders).toHaveLength(2);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { buyerId: 'user-1' },
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(15);

      await service.getMyOrders('user-1', 2, 5);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('getSellerOrders', () => {
    it('should throw ForbiddenException if user has no company', async () => {
      const user = { id: 'user-1', companyId: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.getSellerOrders('user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return seller orders for their company', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const orders = [{ id: 'order-1' }, { id: 'order-2' }];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.order.findMany.mockResolvedValue(orders);
      mockPrisma.order.count.mockResolvedValue(2);

      const result = await service.getSellerOrders('user-1');

      expect(result.orders).toHaveLength(2);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1' },
        })
      );
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto = { status: OrderStatus.CONFIRMED };

    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('order-1', 'user-1', updateStatusDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither buyer nor seller', async () => {
      const order = { id: 'order-1', buyerId: 'buyer-1', companyId: 'company-1' };
      const user = { id: 'other-user', companyId: 'different-company' };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.updateStatus('order-1', 'other-user', updateStatusDto)).rejects.toThrow(ForbiddenException);
    });

    it('should update order status for buyer', async () => {
      const order = { id: 'order-1', buyerId: 'user-1', companyId: 'company-1' };
      const user = { id: 'user-1', companyId: null };
      const updatedOrder = { ...order, status: OrderStatus.CONFIRMED };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-1', 'user-1', updateStatusDto);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should update order status for seller', async () => {
      const order = { id: 'order-1', buyerId: 'buyer-1', companyId: 'company-1' };
      const user = { id: 'seller-1', companyId: 'company-1' };
      const updatedOrder = { ...order, status: OrderStatus.SHIPPED };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const dto = { status: OrderStatus.SHIPPED };
      const result = await service.updateStatus('order-1', 'seller-1', dto);

      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('should release escrow when buyer confirms delivery', async () => {
      const order = { id: 'order-1', buyerId: 'user-1', companyId: 'company-1' };
      const user = { id: 'user-1', companyId: null };
      const escrow = { id: 'escrow-1', status: 'held' };
      const updatedOrder = { ...order, status: OrderStatus.DELIVERED };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.escrow.findUnique.mockResolvedValue(escrow);
      mockPayments.releaseEscrow.mockResolvedValue({ id: 'escrow-1', status: 'released' });
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const dto = { status: OrderStatus.DELIVERED };
      await service.updateStatus('order-1', 'user-1', dto);

      expect(mockPayments.releaseEscrow).toHaveBeenCalledWith('escrow-1');
    });

    it('should not release escrow if no escrow exists', async () => {
      const order = { id: 'order-1', buyerId: 'user-1', companyId: 'company-1' };
      const user = { id: 'user-1', companyId: null };
      const updatedOrder = { ...order, status: OrderStatus.DELIVERED };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.escrow.findUnique.mockResolvedValue(null);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const dto = { status: OrderStatus.DELIVERED };
      await service.updateStatus('order-1', 'user-1', dto);

      expect(mockPayments.releaseEscrow).not.toHaveBeenCalled();
    });
  });

  describe('calculateFreight', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.calculateFreight('order-1', 'seller-1', 50000)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if seller does not own the order', async () => {
      const order = { id: 'order-1', companyId: 'company-1' };
      const user = { id: 'seller-1', companyId: 'different-company' };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.calculateFreight('order-1', 'seller-1', 50000)).rejects.toThrow(ForbiddenException);
    });

    it('should update freight cost and total for seller', async () => {
      const order = { id: 'order-1', companyId: 'company-1', subtotal: 1000000, freightCost: 0, total: 1000000 };
      const user = { id: 'seller-1', companyId: 'company-1' };
      const updatedOrder = { ...order, freightCost: 50000, total: 1050000 };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.calculateFreight('order-1', 'seller-1', 50000);

      expect(result.freightCost).toBe(50000);
      expect(result.total).toBe(1050000);
    });
  });

  describe('order number generation', () => {
    it('should create order with valid order number format', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const products = [{ id: 'product-1', price: 1000000, companyId: 'company-1' }];
      const company = { id: 'company-1', state: 'Kano' };
      const order = { id: 'order-1', orderNumber: 'ORD-ABC123', buyerId: 'user-1', items: [] };
      
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockFreight.calculateFreight.mockReturnValue({ estimatedCost: 0 });
      mockPrisma.order.create.mockResolvedValue(order);
      
      const result = await service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      });

      expect(result.orderNumber).toMatch(/^ORD-.+$/);
    });
  });
});