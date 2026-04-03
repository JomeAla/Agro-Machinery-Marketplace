import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MaintenanceType } from './dto/maintenance.dto';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
    },
    productManual: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    maintenanceSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    maintenanceRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    warrantyClaim: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('addManual', () => {
    const createManualDto = {
      productId: 'product-1',
      title: 'User Manual',
      fileUrl: 'https://example.com/manual.pdf',
      fileType: 'pdf',
    };

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.addManual('user-1', createManualDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own product', async () => {
      const product = { id: 'product-1', sellerId: 'other-user' };
      mockPrisma.product.findUnique.mockResolvedValue(product);

      await expect(service.addManual('user-1', createManualDto)).rejects.toThrow(ForbiddenException);
    });

    it('should add manual successfully', async () => {
      const product = { id: 'product-1', sellerId: 'user-1' };
      const manual = { id: 'manual-1', productId: 'product-1', title: 'User Manual' };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.productManual.create.mockResolvedValue(manual);

      const result = await service.addManual('user-1', createManualDto);

      expect(result.id).toBe('manual-1');
    });
  });

  describe('getManuals', () => {
    it('should return manuals for product', async () => {
      const manuals = [{ id: 'manual-1' }, { id: 'manual-2' }];
      mockPrisma.productManual.findMany.mockResolvedValue(manuals);

      const result = await service.getManuals('product-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.productManual.findMany).toHaveBeenCalledWith({
        where: { productId: 'product-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should order by createdAt descending', async () => {
      mockPrisma.productManual.findMany.mockResolvedValue([]);

      await service.getManuals('product-1');

      expect(mockPrisma.productManual.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('deleteManual', () => {
    it('should throw NotFoundException if manual not found', async () => {
      mockPrisma.productManual.findUnique.mockResolvedValue(null);

      await expect(service.deleteManual('user-1', 'manual-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own product', async () => {
      const manual = { id: 'manual-1', product: { sellerId: 'other-user' } };
      mockPrisma.productManual.findUnique.mockResolvedValue(manual);

      await expect(service.deleteManual('user-1', 'manual-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete manual successfully', async () => {
      const manual = { id: 'manual-1', product: { sellerId: 'user-1' } };
      mockPrisma.productManual.findUnique.mockResolvedValue(manual);
      mockPrisma.productManual.delete.mockResolvedValue({ id: 'manual-1' });

      const result = await service.deleteManual('user-1', 'manual-1');

      expect(result.message).toBe('Manual deleted successfully');
    });
  });

  describe('createSchedule', () => {
    const createScheduleDto = {
      productId: 'product-1',
      title: 'Oil Change',
      description: 'Change engine oil every 500 hours',
      maintenanceType: MaintenanceType.ROUTINE,
      intervalHours: 500,
      notes: 'Use synthetic oil',
    };

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.createSchedule('user-1', createScheduleDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own product', async () => {
      const product = { id: 'product-1', sellerId: 'other-user' };
      mockPrisma.product.findUnique.mockResolvedValue(product);

      await expect(service.createSchedule('user-1', createScheduleDto)).rejects.toThrow(ForbiddenException);
    });

    it('should create schedule successfully', async () => {
      const product = { id: 'product-1', sellerId: 'user-1' };
      const schedule = { id: 'schedule-1', productId: 'product-1' };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.maintenanceSchedule.create.mockResolvedValue(schedule);

      const result = await service.createSchedule('user-1', createScheduleDto);

      expect(result.id).toBe('schedule-1');
    });
  });

  describe('getSchedules', () => {
    it('should return schedules for product', async () => {
      const schedules = [{ id: 'schedule-1' }, { id: 'schedule-2' }];
      mockPrisma.maintenanceSchedule.findMany.mockResolvedValue(schedules);

      const result = await service.getSchedules('product-1');

      expect(result).toHaveLength(2);
    });

    it('should order by intervalHours ascending', async () => {
      mockPrisma.maintenanceSchedule.findMany.mockResolvedValue([]);

      await service.getSchedules('product-1');

      expect(mockPrisma.maintenanceSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { intervalHours: 'asc' },
        })
      );
    });
  });

  describe('deleteSchedule', () => {
    it('should throw NotFoundException if schedule not found', async () => {
      mockPrisma.maintenanceSchedule.findUnique.mockResolvedValue(null);

      await expect(service.deleteSchedule('user-1', 'schedule-1')).rejects.toThrow(NotFoundException);
    });

    it('should delete schedule successfully', async () => {
      const schedule = { id: 'schedule-1', product: { sellerId: 'user-1' } };
      mockPrisma.maintenanceSchedule.findUnique.mockResolvedValue(schedule);
      mockPrisma.maintenanceSchedule.delete.mockResolvedValue({ id: 'schedule-1' });

      const result = await service.deleteSchedule('user-1', 'schedule-1');

      expect(result.message).toBe('Schedule deleted successfully');
    });
  });

  describe('createRecord', () => {
    const createRecordDto = {
      productId: 'product-1',
      scheduleId: 'schedule-1',
      maintenanceType: MaintenanceType.SERVICE,
      description: 'Routine oil change',
      performedAt: '2024-01-15',
      serviceProvider: 'Johns Garage',
      cost: 15000,
    };

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.createRecord('user-1', createRecordDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not buyer or seller', async () => {
      const product = { id: 'product-1', sellerId: 'other-user' };
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.createRecord('user-1', createRecordDto)).rejects.toThrow(ForbiddenException);
    });

    it('should create record for buyer', async () => {
      const product = { id: 'product-1', sellerId: 'seller-1' };
      const order = { id: 'order-1' };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findFirst.mockResolvedValue(order);

      const record = { id: 'record-1', productId: 'product-1' };
      mockPrisma.maintenanceRecord.create.mockResolvedValue(record);

      const result = await service.createRecord('user-1', createRecordDto);

      expect(result.id).toBe('record-1');
    });

    it('should create record for seller', async () => {
      const product = { id: 'product-1', sellerId: 'user-1' };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const record = { id: 'record-1', productId: 'product-1' };
      mockPrisma.maintenanceRecord.create.mockResolvedValue(record);

      const dtoWithoutOrder = { ...createRecordDto, scheduleId: undefined };
      const result = await service.createRecord('user-1', dtoWithoutOrder);

      expect(result.id).toBe('record-1');
    });
  });

  describe('getRecords', () => {
    it('should return records for product', async () => {
      const records = [{ id: 'record-1' }, { id: 'record-2' }];
      mockPrisma.maintenanceRecord.findMany.mockResolvedValue(records);

      const result = await service.getRecords('product-1');

      expect(result).toHaveLength(2);
    });

    it('should include schedule relation', async () => {
      mockPrisma.maintenanceRecord.findMany.mockResolvedValue([]);

      await service.getRecords('product-1');

      expect(mockPrisma.maintenanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { schedule: true },
        })
      );
    });
  });

  describe('createWarrantyClaim', () => {
    const createClaimDto = {
      productId: 'product-1',
      orderId: 'order-1',
      issue: 'Engine not starting',
      description: 'The engine fails to start after 2 months of purchase',
      images: ['https://example.com/image1.jpg'],
    };

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.createWarrantyClaim('user-1', createClaimDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has not purchased product', async () => {
      const product = { id: 'product-1', warrantyMonths: 12 };
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.createWarrantyClaim('user-1', createClaimDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if product has no warranty', async () => {
      const product = { id: 'product-1', warrantyMonths: 0 };
      const order = { id: 'order-1', createdAt: new Date() };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findFirst.mockResolvedValue(order);

      await expect(service.createWarrantyClaim('user-1', createClaimDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if warranty expired', async () => {
      const product = { id: 'product-1', warrantyMonths: 12 };
      const order = { id: 'order-1', createdAt: new Date(Date.now() - 13 * 30 * 24 * 60 * 60 * 1000) };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findFirst.mockResolvedValue(order);

      await expect(service.createWarrantyClaim('user-1', createClaimDto)).rejects.toThrow(BadRequestException);
    });

    it('should create claim successfully', async () => {
      const product = { id: 'product-1', warrantyMonths: 12 };
      const order = { id: 'order-1', createdAt: new Date() };
      const claim = { id: 'claim-1', status: 'pending' };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.warrantyClaim.create.mockResolvedValue(claim);

      const result = await service.createWarrantyClaim('user-1', createClaimDto);

      expect(result.id).toBe('claim-1');
      expect(result.status).toBe('pending');
    });
  });

  describe('getMyClaims', () => {
    it('should return user warranty claims', async () => {
      const claims = [{ id: 'claim-1' }, { id: 'claim-2' }];
      mockPrisma.warrantyClaim.findMany.mockResolvedValue(claims);

      const result = await service.getMyClaims('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.warrantyClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
    });
  });

  describe('getAllClaims', () => {
    it('should return all warranty claims', async () => {
      const claims = [{ id: 'claim-1' }, { id: 'claim-2' }];
      mockPrisma.warrantyClaim.findMany.mockResolvedValue(claims);

      const result = await service.getAllClaims();

      expect(result).toHaveLength(2);
    });

    it('should include user and product relations', async () => {
      mockPrisma.warrantyClaim.findMany.mockResolvedValue([]);

      await service.getAllClaims();

      expect(mockPrisma.warrantyClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.any(Object),
            product: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('updateClaimStatus', () => {
    it('should throw NotFoundException if claim not found', async () => {
      mockPrisma.warrantyClaim.findUnique.mockResolvedValue(null);

      await expect(service.updateClaimStatus('claim-1', { status: 'approved', adminNotes: 'Approved' })).rejects.toThrow(NotFoundException);
    });

    it('should update claim status successfully', async () => {
      const claim = { id: 'claim-1', status: 'pending' };
      const updated = { ...claim, status: 'approved', adminNotes: 'Approved' };

      mockPrisma.warrantyClaim.findUnique.mockResolvedValue(claim);
      mockPrisma.warrantyClaim.update.mockResolvedValue(updated);

      const dto = { status: 'approved', adminNotes: 'Approved' };
      const result = await service.updateClaimStatus('claim-1', dto);

      expect(result.status).toBe('approved');
    });
  });

  describe('getWarrantyStatus', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getWarrantyStatus('product-1', 'order-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order not found', async () => {
      const product = { id: 'product-1', warrantyMonths: 12 };
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.getWarrantyStatus('product-1', 'order-1')).rejects.toThrow(NotFoundException);
    });

    it('should return no warranty if product has no warranty', async () => {
      const product = { id: 'product-1', warrantyMonths: 0 };
      const order = { id: 'order-1', createdAt: new Date() };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.getWarrantyStatus('product-1', 'order-1');

      expect(result.hasWarranty).toBe(false);
      expect(result.message).toBe('This product does not have warranty coverage');
    });

    it('should return active warranty status', async () => {
      const product = { id: 'product-1', warrantyMonths: 12 };
      const order = { id: 'order-1', createdAt: new Date() };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.getWarrantyStatus('product-1', 'order-1');

      expect(result.hasWarranty).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.warrantyMonths).toBe(12);
    });

    it('should return expired warranty status', async () => {
      const product = { id: 'product-1', warrantyMonths: 12 };
      const order = { id: 'order-1', createdAt: new Date(Date.now() - 13 * 30 * 24 * 60 * 60 * 1000) };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.getWarrantyStatus('product-1', 'order-1');

      expect(result.hasWarranty).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.daysRemaining).toBe(0);
    });
  });
});