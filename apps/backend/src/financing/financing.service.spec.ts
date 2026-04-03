import { Test, TestingModule } from '@nestjs/testing';
import { FinancingService } from './financing.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FinancingStatus, FinancingType } from '@prisma/client';

describe('FinancingService', () => {
  let service: FinancingService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
    },
    financingRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinancingService>(FinancingService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createFinancingDto = {
      productId: 'product-1',
      financingType: FinancingType.LOAN,
      amount: 15000000,
      tenureMonths: 36,
      purpose: 'Purchase of agricultural tractor',
      state: 'Lagos',
      city: 'Ikeja',
    };

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', createFinancingDto)).rejects.toThrow(NotFoundException);
    });

    it('should create financing request successfully', async () => {
      const product = { id: 'product-1', title: 'Tractor' };
      const request = {
        id: 'fin-1',
        userId: 'user-1',
        productId: 'product-1',
        status: FinancingStatus.PENDING,
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.financingRequest.create.mockResolvedValue(request);

      const result = await service.create('user-1', createFinancingDto);

      expect(result.id).toBe('fin-1');
      expect(result.status).toBe(FinancingStatus.PENDING);
    });

    it('should include user and product in response', async () => {
      const product = { id: 'product-1', title: 'Tractor' };
      const request = {
        id: 'fin-1',
        userId: 'user-1',
        productId: 'product-1',
        user: { id: 'user-1', firstName: 'John' },
        product: { id: 'product-1', title: 'Tractor' },
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.financingRequest.create.mockResolvedValue(request);

      await service.create('user-1', createFinancingDto);

      expect(mockPrisma.financingRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.any(Object),
            product: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all financing requests with pagination', async () => {
      const requests = [
        { id: 'fin-1', status: FinancingStatus.PENDING },
        { id: 'fin-2', status: FinancingStatus.APPROVED },
      ];

      mockPrisma.financingRequest.findMany.mockResolvedValue(requests);
      mockPrisma.financingRequest.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.requests).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrisma.financingRequest.findMany.mockResolvedValue([]);
      mockPrisma.financingRequest.count.mockResolvedValue(0);

      await service.findAll({ status: FinancingStatus.PENDING });

      expect(mockPrisma.financingRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: FinancingStatus.PENDING,
          }),
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.financingRequest.findMany.mockResolvedValue([]);
      mockPrisma.financingRequest.count.mockResolvedValue(20);

      await service.findAll({ page: 2, limit: 5 });

      expect(mockPrisma.financingRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('findById', () => {
    it('should return financing request by id', async () => {
      const request = { id: 'fin-1', status: FinancingStatus.PENDING };
      mockPrisma.financingRequest.findUnique.mockResolvedValue(request);

      const result = await service.findById('fin-1');

      expect(result).toEqual(request);
    });

    it('should throw NotFoundException if request not found', async () => {
      mockPrisma.financingRequest.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyRequests', () => {
    it('should return user financing requests', async () => {
      const requests = [{ id: 'fin-1' }, { id: 'fin-2' }];

      mockPrisma.financingRequest.findMany.mockResolvedValue(requests);
      mockPrisma.financingRequest.count.mockResolvedValue(2);

      const result = await service.getMyRequests('user-1', 1, 10);

      expect(result.requests).toHaveLength(2);
      expect(mockPrisma.financingRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.financingRequest.findMany.mockResolvedValue([]);
      mockPrisma.financingRequest.count.mockResolvedValue(15);

      await service.getMyRequests('user-1', 2, 5);

      expect(mockPrisma.financingRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto = {
      status: FinancingStatus.APPROVED,
      notes: 'Approved for financing',
    };

    it('should throw NotFoundException if request not found', async () => {
      mockPrisma.financingRequest.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('fin-1', updateStatusDto)).rejects.toThrow(NotFoundException);
    });

    it('should update status successfully', async () => {
      const request = { id: 'fin-1', status: FinancingStatus.PENDING };
      const updated = { ...request, status: FinancingStatus.APPROVED };

      mockPrisma.financingRequest.findUnique.mockResolvedValue(request);
      mockPrisma.financingRequest.update.mockResolvedValue(updated);

      const result = await service.updateStatus('fin-1', updateStatusDto);

      expect(result.status).toBe(FinancingStatus.APPROVED);
    });

    it('should include admin notes when provided', async () => {
      const request = { id: 'fin-1', status: FinancingStatus.PENDING };
      const updated = { ...request, status: FinancingStatus.REJECTED, adminNotes: 'Not eligible' };

      mockPrisma.financingRequest.findUnique.mockResolvedValue(request);
      mockPrisma.financingRequest.update.mockResolvedValue(updated);

      const dto = { status: FinancingStatus.REJECTED, notes: 'Not eligible' };
      await service.updateStatus('fin-1', dto);

      expect(mockPrisma.financingRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: FinancingStatus.REJECTED,
            adminNotes: 'Not eligible',
          }),
        })
      );
    });
  });

  describe('calculateInstallment', () => {
    it('should calculate monthly payment correctly', () => {
      const result = service.calculateInstallment({
        amount: 12000000,
        tenureMonths: 12,
        interestRate: 15,
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.principal).toBe(12000000);
      expect(result.tenureMonths).toBe(12);
      expect(result.interestRate).toBe(15);
    });

    it('should use default interest rate of 15% if not provided', () => {
      const result = service.calculateInstallment({
        amount: 10000000,
        tenureMonths: 24,
      });

      expect(result.interestRate).toBe(15);
    });

    it('should calculate total payment correctly', () => {
      const result = service.calculateInstallment({
        amount: 10000000,
        tenureMonths: 12,
        interestRate: 10,
      });

      const calculatedTotal = result.monthlyPayment * 12;
      expect(Math.abs(result.totalPayment - calculatedTotal)).toBeLessThan(10);
    });

    it('should calculate total interest correctly', () => {
      const result = service.calculateInstallment({
        amount: 10000000,
        tenureMonths: 12,
        interestRate: 10,
      });

      expect(result.totalInterest).toBe(result.totalPayment - 10000000);
    });

    it('should generate amortization schedule with correct number of months', () => {
      const result = service.calculateInstallment({
        amount: 10000000,
        tenureMonths: 24,
        interestRate: 12,
      });

      expect(result.amortizationSchedule).toHaveLength(24);
    });

    it('should have correct structure for each schedule entry', () => {
      const result = service.calculateInstallment({
        amount: 10000000,
        tenureMonths: 12,
        interestRate: 15,
      });

      const firstEntry = result.amortizationSchedule[0];
      expect(firstEntry).toHaveProperty('month');
      expect(firstEntry).toHaveProperty('payment');
      expect(firstEntry).toHaveProperty('principal');
      expect(firstEntry).toHaveProperty('interest');
      expect(firstEntry).toHaveProperty('balance');
    });

    it('should have decreasing balance in amortization schedule', () => {
      const result = service.calculateInstallment({
        amount: 10000000,
        tenureMonths: 12,
        interestRate: 15,
      });

      for (let i = 1; i < result.amortizationSchedule.length; i++) {
        expect(result.amortizationSchedule[i].balance).toBeLessThan(result.amortizationSchedule[i - 1].balance);
      }
    });

    it('should have final balance of 0', () => {
      const result = service.calculateInstallment({
        amount: 10000000,
        tenureMonths: 12,
        interestRate: 15,
      });

      const lastEntry = result.amortizationSchedule[result.amortizationSchedule.length - 1];
      expect(lastEntry.balance).toBe(0);
    });
  });

  describe('getProviders', () => {
    it('should return list of financing providers', async () => {
      const providers = await service.getProviders();

      expect(providers).toHaveLength(3);
      expect(providers[0]).toHaveProperty('id');
      expect(providers[0]).toHaveProperty('name');
      expect(providers[0]).toHaveProperty('description');
      expect(providers[0]).toHaveProperty('supportedTypes');
    });

    it('should include Agrifinance provider', async () => {
      const providers = await service.getProviders();

      const agrifinance = providers.find(p => p.id === 'agrifinance');
      expect(agrifinance).toBeDefined();
      expect(agrifinance.supportedTypes).toContain('LEASE');
    });

    it('should include First Bank provider', async () => {
      const providers = await service.getProviders();

      const firstbank = providers.find(p => p.id === 'firstbank');
      expect(firstbank).toBeDefined();
      expect(firstbank.supportedTypes).toContain('LOAN');
    });
  });
});