import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    company: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCompanyDto = {
      name: 'Test Company Ltd',
      cacNumber: 'RC123456',
      description: 'Agricultural equipment dealer',
      address: '123 Main Street',
      city: 'Lagos',
      state: 'Lagos',
      website: 'https://testcompany.com',
      phone: '+2348012345678',
      email: 'info@testcompany.com',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', createCompanyDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a seller', async () => {
      const user = { id: 'user-1', role: Role.BUYER };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.create('user-1', createCompanyDto)).rejects.toThrow(ForbiddenException);
    });

    it('should create company successfully', async () => {
      const user = { id: 'user-1', role: Role.SELLER };
      const company = {
        id: 'company-1',
        name: 'Test Company Ltd',
        isVerified: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.company.create.mockResolvedValue(company);
      mockPrisma.user.update.mockResolvedValue({ ...user, companyId: 'company-1' });

      const result = await service.create('user-1', createCompanyDto);

      expect(result.id).toBe('company-1');
      expect(result.isVerified).toBe(false);
    });

    it('should associate user with company after creation', async () => {
      const user = { id: 'user-1', role: Role.SELLER };
      const company = { id: 'company-1', name: 'Test Company' };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.company.create.mockResolvedValue(company);
      mockPrisma.user.update.mockResolvedValue({ ...user, companyId: 'company-1' });

      await service.create('user-1', createCompanyDto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { companyId: 'company-1' },
      });
    });
  });

  describe('findById', () => {
    it('should return company by id', async () => {
      const company = { id: 'company-1', name: 'Test Company' };
      mockPrisma.company.findUnique.mockResolvedValue(company);

      const result = await service.findById('company-1');

      expect(result).toEqual(company);
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should include users and products', async () => {
      const company = { id: 'company-1', name: 'Test Company' };
      mockPrisma.company.findUnique.mockResolvedValue(company);

      await service.findById('company-1');

      expect(mockPrisma.company.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            users: expect.any(Object),
            products: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('update', () => {
    const updateCompanyDto = {
      name: 'Updated Company Name',
      description: 'Updated description',
      phone: '+2348012345678',
    };

    it('should throw ForbiddenException if user does not own company', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.update('user-1', 'different-company', updateCompanyDto)).rejects.toThrow(ForbiddenException);
    });

    it('should update company successfully', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const company = { id: 'company-1', name: 'Old Name' };
      const updated = { ...company, ...updateCompanyDto };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.company.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'company-1', updateCompanyDto);

      expect(result.name).toBe('Updated Company Name');
    });
  });

  describe('getMyCompany', () => {
    it('should throw NotFoundException if user has no company', async () => {
      const user = { id: 'user-1', companyId: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.getMyCompany('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should return company for user with company', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const company = { id: 'company-1', name: 'Test Company' };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.company.findUnique.mockResolvedValue(company);

      const result = await service.getMyCompany('user-1');

      expect(result.id).toBe('company-1');
    });
  });

  describe('verifyCompany', () => {
    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(service.verifyCompany('company-1', true)).rejects.toThrow(NotFoundException);
    });

    it('should verify company and set verifiedAt', async () => {
      const company = { id: 'company-1', isVerified: false };
      const verified = { ...company, isVerified: true, verifiedAt: new Date() };

      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockPrisma.company.update.mockResolvedValue(verified);

      const result = await service.verifyCompany('company-1', true);

      expect(result.isVerified).toBe(true);
      expect(result.verifiedAt).toBeDefined();
    });

    it('should unverify company and clear verifiedAt', async () => {
      const company = { id: 'company-1', isVerified: true, verifiedAt: new Date() };
      const unverified = { ...company, isVerified: false, verifiedAt: null };

      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockPrisma.company.update.mockResolvedValue(unverified);

      const result = await service.verifyCompany('company-1', false);

      expect(result.isVerified).toBe(false);
      expect(result.verifiedAt).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return only verified companies', async () => {
      const companies = [
        { id: 'company-1', isVerified: true },
        { id: 'company-2', isVerified: true },
      ];

      mockPrisma.company.findMany.mockResolvedValue(companies);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isVerified: true },
        })
      );
    });

    it('should include users and counts', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            users: expect.any(Object),
            _count: { select: { products: true, orders: true } },
          }),
        })
      );
    });

    it('should order by createdAt descending', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });
});