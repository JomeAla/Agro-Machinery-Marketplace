import { Test, TestingModule } from '@nestjs/testing';
import { FreightService } from './freight.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { VehicleType } from './dto/freight.dto';

describe('FreightService', () => {
  let service: FreightService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    freightQuote: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreightService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FreightService>(FreightService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getNigerianStates', () => {
    it('should return all 36 Nigerian states plus FCT', async () => {
      const states = service.getNigerianStates();

      expect(states).toHaveLength(37);
    });

    it('should include Lagos state', async () => {
      const states = service.getNigerianStates();
      const lagos = states.find(s => s.name === 'Lagos');

      expect(lagos).toBeDefined();
      expect(lagos.capital).toBe('Ikeja');
      expect(lagos.region).toBe('South West');
    });

    it('should include FCT (Abuja)', async () => {
      const states = service.getNigerianStates();
      const fct = states.find(s => s.name === 'FCT');

      expect(fct).toBeDefined();
      expect(fct.capital).toBe('Abuja');
    });
  });

  describe('calculateFreight', () => {
    it('should calculate freight for same region', () => {
      const result = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Ogun',
        vehicleType: VehicleType.PICKUP,
        units: 1,
      });

      expect(result.estimatedCost).toBeGreaterThan(0);
      expect(result.origin.region).toBe('South West');
      expect(result.destination.region).toBe('South West');
      expect(result.distanceMultiplier).toBe(1.0);
    });

    it('should throw BadRequestException for invalid origin state', () => {
      expect(() =>
        service.calculateFreight({
          originState: 'InvalidState',
          destinationState: 'Lagos',
          vehicleType: VehicleType.PICKUP,
        })
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid destination state', () => {
      expect(() =>
        service.calculateFreight({
          originState: 'Lagos',
          destinationState: 'InvalidState',
          vehicleType: VehicleType.PICKUP,
        })
      ).toThrow(BadRequestException);
    });

    it('should apply weight multiplier for heavy loads', () => {
      const resultWithoutWeight = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Kano',
        vehicleType: VehicleType.TRUCK,
        units: 1,
      });

      const resultWithWeight = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Kano',
        vehicleType: VehicleType.TRUCK,
        weight: 10000,
        units: 1,
      });

      expect(resultWithWeight.weightMultiplier).toBeGreaterThan(1);
      expect(resultWithWeight.estimatedCost).toBeGreaterThan(resultWithoutWeight.estimatedCost);
    });

    it('should apply unit multiplier for multiple units', () => {
      const resultSingle = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Ogun',
        vehicleType: VehicleType.PICKUP,
        units: 1,
      });

      const resultMultiple = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Ogun',
        vehicleType: VehicleType.PICKUP,
        units: 5,
      });

      expect(resultMultiple.unitMultiplier).toBeGreaterThan(resultSingle.unitMultiplier);
    });

    it('should use different base rates for different vehicle types', () => {
      const pickup = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Ogun',
        vehicleType: VehicleType.PICKUP,
      });

      const truck = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Ogun',
        vehicleType: VehicleType.TRUCK,
      });

      expect(truck.baseRate).toBeGreaterThan(pickup.baseRate);
    });

    it('should estimate delivery days correctly', () => {
      const result = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Kano',
        vehicleType: VehicleType.TRUCK,
      });

      expect(result.estimatedDays).toBeDefined();
    });

    it('should return breakdown with cost components', () => {
      const result = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Ogun',
        vehicleType: VehicleType.FLATBED,
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.baseDistanceCost).toBeGreaterThan(0);
    });

    it('should calculate higher cost for longer distance routes', () => {
      const sameRegion = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Ogun',
        vehicleType: VehicleType.PICKUP,
      });

      const crossRegion = service.calculateFreight({
        originState: 'Lagos',
        destinationState: 'Kano',
        vehicleType: VehicleType.PICKUP,
      });

      expect(crossRegion.estimatedCost).toBeGreaterThan(sameRegion.estimatedCost);
    });
  });

  describe('createQuote', () => {
    const createQuoteDto = {
      orderId: 'order-1',
      originState: 'Kano',
      destinationState: 'Lagos',
      vehicleType: VehicleType.TRUCK,
      cost: 150000,
      estimatedDays: '3-4 days',
      notes: 'Delivery within 4 days',
    };

    it('should throw BadRequestException if user has no company', async () => {
      const user = { id: 'user-1', companyId: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.createQuote('user-1', createQuoteDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if order not found', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.createQuote('user-1', createQuoteDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const order = { id: 'order-1', companyId: 'different-company' };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(service.createQuote('user-1', createQuoteDto)).rejects.toThrow(ForbiddenException);
    });

    it('should create freight quote successfully', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const order = { id: 'order-1', companyId: 'company-1', total: 1000000 };
      const quote = { id: 'quote-1', orderId: 'order-1', cost: 150000 };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.freightQuote.create.mockResolvedValue(quote);
      mockPrisma.order.update.mockResolvedValue({ ...order, total: 1150000 });

      const result = await service.createQuote('user-1', createQuoteDto);

      expect(result.id).toBe('quote-1');
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });
  });

  describe('getQuotesByOrder', () => {
    it('should return freight quotes for an order', async () => {
      const quotes = [{ id: 'quote-1' }, { id: 'quote-2' }];
      mockPrisma.freightQuote.findMany.mockResolvedValue(quotes);

      const result = await service.getQuotesByOrder('order-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.freightQuote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: 'order-1' },
        })
      );
    });

    it('should order by createdAt descending', async () => {
      mockPrisma.freightQuote.findMany.mockResolvedValue([]);

      await service.getQuotesByOrder('order-1');

      expect(mockPrisma.freightQuote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if quote not found', async () => {
      mockPrisma.freightQuote.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('quote-1', 'user-1', { status: 'accepted' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own quote', async () => {
      const quote = { id: 'quote-1', sellerId: 'other-user' };
      mockPrisma.freightQuote.findUnique.mockResolvedValue(quote);

      await expect(
        service.updateStatus('quote-1', 'user-1', { status: 'accepted' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update status successfully', async () => {
      const quote = { id: 'quote-1', sellerId: 'user-1' };
      const updated = { ...quote, status: 'accepted' };

      mockPrisma.freightQuote.findUnique.mockResolvedValue(quote);
      mockPrisma.freightQuote.update.mockResolvedValue(updated);

      const result = await service.updateStatus('quote-1', 'user-1', { status: 'accepted' });

      expect(result.status).toBe('accepted');
    });
  });
});