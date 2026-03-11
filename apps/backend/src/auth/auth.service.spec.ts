import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    company: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.BUYER,
      phone: '+2348012345678',
    };

    it('should throw ConflictException if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: registerDto.email } });
    });

    it('should successfully register a buyer user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
        role: registerDto.role,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: 'hashed-password',
        profile: { country: 'Nigeria' },
        company: null,
      });

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe(registerDto.role);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should create company for seller users', async () => {
      const sellerDto = {
        ...registerDto,
        role: Role.SELLER,
        companyName: 'Test Company',
        cacNumber: 'RC123456',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.company.create.mockResolvedValue({ id: 'company-1', name: 'Test Company' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: sellerDto.email,
        role: sellerDto.role,
        companyId: 'company-1',
        profile: { country: 'Nigeria' },
        company: { id: 'company-1', name: 'Test Company' },
      });

      const result = await service.register(sellerDto);

      expect(mockPrisma.company.create).toHaveBeenCalledWith({
        data: {
          name: sellerDto.companyName,
          cacNumber: sellerDto.cacNumber,
          isVerified: false,
        },
      });
      expect(result.user.role).toBe(Role.SELLER);
    });

    it('should throw error if company creation fails', async () => {
      const sellerDto = {
        ...registerDto,
        role: Role.SELLER,
        companyName: 'Test Company',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.company.create.mockRejectedValue(new Error('Company creation failed'));

      await expect(service.register(sellerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = {
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
        role: Role.BUYER,
        firstName: 'John',
        lastName: 'Doe',
        profile: null,
        company: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login with valid credentials', async () => {
      const user = {
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
        role: Role.BUYER,
        firstName: 'John',
        lastName: 'Doe',
        profile: { country: 'Nigeria' },
        company: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(loginDto.email);
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should generate JWT with correct payload', async () => {
      const user = {
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
        role: Role.BUYER,
        firstName: 'John',
        lastName: 'Doe',
        profile: null,
        company: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      await service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    });
  });

  describe('validateUser', () => {
    it('should return user with profile and company', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser('user-1');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { profile: true, company: true },
      });
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('non-existent');

      expect(result).toBeNull();
    });
  });
});