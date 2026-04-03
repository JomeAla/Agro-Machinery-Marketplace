import { Test, TestingModule } from '@nestjs/testing';
import { RfqService } from './rfq.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RfqStatus, Role } from '@prisma/client';

describe('RfqService', () => {
  let service: RfqService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
    },
    rfq: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    rfqQuote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([{ id: 'quote-1' }, { id: 'rfq-1' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RfqService>(RfqService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRfqDto = {
      title: 'John Deere Tractor',
      description: 'Looking for a 75HP tractor for my farm',
      quantity: 1,
      budget: 15000000,
      neededBy: '2024-12-31',
      deliveryState: 'Lagos',
      deliveryCity: 'Ikeja',
      productId: 'product-1',
    };

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', createRfqDto)).rejects.toThrow(NotFoundException);
    });

    it('should create RFQ without product association', async () => {
      const rfq = {
        id: 'rfq-1',
        rfqNumber: 'RFQ-ABC123',
        buyerId: 'user-1',
        status: RfqStatus.OPEN,
      };

      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.rfq.create.mockResolvedValue(rfq);

      const dtoWithoutProduct = { ...createRfqDto, productId: undefined };
      const result = await service.create('user-1', dtoWithoutProduct);

      expect(result.id).toBe('rfq-1');
      expect(result.status).toBe(RfqStatus.OPEN);
    });

    it('should create RFQ with product association', async () => {
      const product = { id: 'product-1', title: 'Tractor' };
      const rfq = {
        id: 'rfq-1',
        rfqNumber: 'RFQ-ABC123',
        buyerId: 'user-1',
        productId: 'product-1',
        status: RfqStatus.OPEN,
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.rfq.create.mockResolvedValue(rfq);

      const result = await service.create('user-1', createRfqDto);

      expect(result.productId).toBe('product-1');
    });

    it('should set default quantity to 1 if not provided', async () => {
      const rfq = {
        id: 'rfq-1',
        rfqNumber: 'RFQ-ABC123',
        buyerId: 'user-1',
        quantity: 1,
      };

      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.rfq.create.mockResolvedValue(rfq);

      const dtoWithoutQuantity = {
        title: 'Test RFQ',
        description: 'Test description',
      };
      await service.create('user-1', dtoWithoutQuantity);

      expect(mockPrisma.rfq.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 1,
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all RFQs with pagination', async () => {
      const mockRfqs = [
        { id: 'rfq-1', rfqNumber: 'RFQ001', status: RfqStatus.OPEN },
        { id: 'rfq-2', rfqNumber: 'RFQ002', status: RfqStatus.QUOTED },
      ];

      mockPrisma.rfq.findMany.mockResolvedValue(mockRfqs);
      mockPrisma.rfq.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.rfqs).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter RFQs by status', async () => {
      mockPrisma.rfq.findMany.mockResolvedValue([]);
      mockPrisma.rfq.count.mockResolvedValue(0);

      await service.findAll({ status: RfqStatus.OPEN });

      expect(mockPrisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RfqStatus.OPEN,
          }),
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.rfq.findMany.mockResolvedValue([]);
      mockPrisma.rfq.count.mockResolvedValue(20);

      await service.findAll({ page: 2, limit: 5 });

      expect(mockPrisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });

    it('should return empty array when no RFQs found', async () => {
      mockPrisma.rfq.findMany.mockResolvedValue([]);
      mockPrisma.rfq.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.rfqs).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return RFQ by id', async () => {
      const rfq = { id: 'rfq-1', rfqNumber: 'RFQ001' };
      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);

      const result = await service.findById('rfq-1');

      expect(result).toEqual(rfq);
    });

    it('should throw NotFoundException if RFQ not found', async () => {
      mockPrisma.rfq.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should include related data (buyer, product, quotes)', async () => {
      const rfq = { id: 'rfq-1', rfqNumber: 'RFQ001' };
      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);

      await service.findById('rfq-1');

      expect(mockPrisma.rfq.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            buyer: expect.any(Object),
            product: expect.any(Object),
            quotes: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('update', () => {
    const updateRfqDto = {
      title: 'Updated Title',
      description: 'Updated description',
      quantity: 2,
    };

    it('should throw NotFoundException if RFQ not found', async () => {
      mockPrisma.rfq.findUnique.mockResolvedValue(null);

      await expect(service.update('user-1', 'rfq-1', updateRfqDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the buyer', async () => {
      const rfq = { id: 'rfq-1', buyerId: 'different-user' };
      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);

      await expect(service.update('user-1', 'rfq-1', updateRfqDto)).rejects.toThrow(ForbiddenException);
    });

    it('should update RFQ successfully', async () => {
      const rfq = { id: 'rfq-1', buyerId: 'user-1' };
      const updatedRfq = { ...rfq, ...updateRfqDto };

      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);
      mockPrisma.rfq.update.mockResolvedValue(updatedRfq);

      const result = await service.update('user-1', 'rfq-1', updateRfqDto);

      expect(result.title).toBe('Updated Title');
      expect(result.quantity).toBe(2);
    });

    it('should convert neededBy string to Date', async () => {
      const rfq = { id: 'rfq-1', buyerId: 'user-1' };
      const updatedRfq = { ...rfq, neededBy: new Date('2024-12-31') };

      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);
      mockPrisma.rfq.update.mockResolvedValue(updatedRfq);

      const dto = { neededBy: '2024-12-31' };
      await service.update('user-1', 'rfq-1', dto);

      expect(mockPrisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            neededBy: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if RFQ not found', async () => {
      mockPrisma.rfq.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'rfq-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the buyer', async () => {
      const rfq = { id: 'rfq-1', buyerId: 'different-user' };
      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);

      await expect(service.delete('user-1', 'rfq-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete RFQ successfully', async () => {
      const rfq = { id: 'rfq-1', buyerId: 'user-1' };
      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);
      mockPrisma.rfq.delete.mockResolvedValue({ id: 'rfq-1' });

      const result = await service.delete('user-1', 'rfq-1');

      expect(result.message).toBe('RFQ deleted successfully');
      expect(mockPrisma.rfq.delete).toHaveBeenCalledWith({ where: { id: 'rfq-1' } });
    });
  });

  describe('getMyRfqs', () => {
    it('should return buyer RFQs with pagination', async () => {
      const rfqs = [{ id: 'rfq-1' }, { id: 'rfq-2' }];

      mockPrisma.rfq.findMany.mockResolvedValue(rfqs);
      mockPrisma.rfq.count.mockResolvedValue(2);

      const result = await service.getMyRfqs('user-1', 1, 10);

      expect(result.rfqs).toHaveLength(2);
      expect(mockPrisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { buyerId: 'user-1' },
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.rfq.findMany.mockResolvedValue([]);
      mockPrisma.rfq.count.mockResolvedValue(15);

      await service.getMyRfqs('user-1', 2, 5);

      expect(mockPrisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('getOpenRfqsForSellers', () => {
    it('should return only open RFQs', async () => {
      const rfqs = [{ id: 'rfq-1', status: RfqStatus.OPEN }];

      mockPrisma.rfq.findMany.mockResolvedValue(rfqs);
      mockPrisma.rfq.count.mockResolvedValue(1);

      const result = await service.getOpenRfqsForSellers();

      expect(result.rfqs).toHaveLength(1);
      expect(mockPrisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: RfqStatus.OPEN },
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.rfq.findMany.mockResolvedValue([]);
      mockPrisma.rfq.count.mockResolvedValue(10);

      await service.getOpenRfqsForSellers(2, 5);

      expect(mockPrisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('createQuote', () => {
    const createQuoteDto = {
      rfqId: 'rfq-1',
      price: 14000000,
      freightCost: 500000,
      notes: 'Free delivery within Lagos',
    };

    it('should throw ForbiddenException if user is not a seller', async () => {
      const user = { id: 'user-1', role: Role.BUYER, companyId: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.createQuote('user-1', createQuoteDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if seller has no company', async () => {
      const user = { id: 'user-1', role: Role.SELLER, companyId: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.createQuote('user-1', createQuoteDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if RFQ not found', async () => {
      const user = { id: 'user-1', role: Role.SELLER, companyId: 'company-1' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.rfq.findUnique.mockResolvedValue(null);

      await expect(service.createQuote('user-1', createQuoteDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if RFQ is not open', async () => {
      const user = { id: 'user-1', role: Role.SELLER, companyId: 'company-1' };
      const rfq = { id: 'rfq-1', status: RfqStatus.ACCEPTED };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);

      await expect(service.createQuote('user-1', createQuoteDto)).rejects.toThrow(ForbiddenException);
    });

    it('should create quote successfully', async () => {
      const user = { id: 'user-1', role: Role.SELLER, companyId: 'company-1' };
      const rfq = { id: 'rfq-1', status: RfqStatus.OPEN };
      const quote = {
        id: 'quote-1',
        rfqId: 'rfq-1',
        sellerId: 'user-1',
        price: 14000000,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.rfq.findUnique.mockResolvedValue(rfq);
      mockPrisma.rfqQuote.create.mockResolvedValue(quote);

      const result = await service.createQuote('user-1', createQuoteDto);

      expect(result.id).toBe('quote-1');
      expect(result.price).toBe(14000000);
    });
  });

  describe('acceptQuote', () => {
    it('should throw NotFoundException if quote not found', async () => {
      mockPrisma.rfqQuote.findUnique.mockResolvedValue(null);

      await expect(service.acceptQuote('user-1', 'quote-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the RFQ buyer', async () => {
      const quote = { id: 'quote-1', rfq: { buyerId: 'different-user' } };
      mockPrisma.rfqQuote.findUnique.mockResolvedValue(quote);

      await expect(service.acceptQuote('user-1', 'quote-1')).rejects.toThrow(ForbiddenException);
    });

    it('should accept quote and update RFQ status', async () => {
      const quote = { id: 'quote-1', rfq: { buyerId: 'user-1', rfqId: 'rfq-1' } };
      mockPrisma.rfqQuote.findUnique.mockResolvedValue(quote);
      mockPrisma.rfqQuote.update.mockResolvedValue({ ...quote, isAccepted: true });
      mockPrisma.rfq.update.mockResolvedValue({ id: 'rfq-1', status: RfqStatus.ACCEPTED });

      const result = await service.acceptQuote('user-1', 'quote-1');

      expect(result.message).toBe('Quote accepted successfully');
      expect(result.quoteId).toBe('quote-1');
    });
  });

  describe('generateRfqNumber', () => {
    it('should create RFQ with valid RFQ number format', async () => {
      const rfq = { id: 'rfq-1', rfqNumber: 'RFQ-ABC123', buyerId: 'user-1' };

      mockPrisma.rfq.create.mockResolvedValue(rfq);

      const result = await service.create('user-1', {
        title: 'Test RFQ',
        description: 'Test description',
      });

      expect(result.rfqNumber).toMatch(/^RFQ-.+$/);
    });
  });
});