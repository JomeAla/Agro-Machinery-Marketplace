import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    company: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect((result as any).password).toBeUndefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should include profile and company', async () => {
      const user = { id: 'user-1', password: 'hash' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await service.findById('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            profile: true,
            company: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+2348012345678',
      bio: 'Farmer and agricultural enthusiast',
      avatar: 'https://example.com/avatar.jpg',
      address: '123 Farm Street',
      city: 'Abuja',
      state: 'Abuja',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('user-1', updateProfileDto)).rejects.toThrow(NotFoundException);
    });

    it('should update profile successfully', async () => {
      const user = { id: 'user-1', password: 'hash' };
      const updated = {
        ...user,
        firstName: 'John',
        lastName: 'Doe',
        profile: { bio: 'Updated bio' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile('user-1', updateProfileDto);

      expect(result.firstName).toBe('John');
    });

    it('should update both user and profile data', async () => {
      const user = { id: 'user-1', password: 'hash' };
      const updated = { ...user, ...updateProfileDto };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      await service.updateProfile('user-1', updateProfileDto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'John',
            profile: expect.objectContaining({
              update: expect.objectContaining({
                bio: 'Farmer and agricultural enthusiast',
              }),
            }),
          }),
        })
      );
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('user-1', changePasswordDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if current password is incorrect', async () => {
      const user = { id: 'user-1', password: 'hashed-old' };
      
      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      await expect(service.changePassword('user-1', changePasswordDto)).rejects.toThrow(ForbiddenException);
    });

    it('should change password successfully', async () => {
      const user = { id: 'user-1', password: 'hashed-password' };
      
      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
      jest.spyOn(require('bcrypt'), 'hash').mockResolvedValue('new-hashed-password');
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.changePassword('user-1', changePasswordDto);

      expect(result.message).toBe('Password changed successfully');
    });

    it('should hash new password before updating', async () => {
      const user = { id: 'user-1', password: 'hashed-old' };
      
      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
      jest.spyOn(require('bcrypt'), 'hash').mockResolvedValue('new-hashed');
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      await service.changePassword('user-1', changePasswordDto);

      expect(require('bcrypt').hash).toHaveBeenCalledWith('newpassword123', 10);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = { id: 'user-1', password: 'hash' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
    });
  });

  describe('updateCompany', () => {
    const updateCompanyDto = {
      name: 'Updated Company',
      cacNumber: 'RC999999',
      description: 'Updated description',
      cacDocument: 'https://example.com/cac.pdf',
      logo: 'https://example.com/logo.png',
      website: 'https://updatedcompany.com',
      email: 'new@company.com',
      phone: '+2348012345678',
      address: '456 New Street',
      city: 'Lagos',
      state: 'Lagos',
    };

    it('should throw BadRequestException if user has no company', async () => {
      const user = { id: 'user-1', companyId: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.updateCompany('user-1', updateCompanyDto)).rejects.toThrow(BadRequestException);
    });

    it('should update company successfully', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const company = { id: 'company-1', cacNumber: 'RC123456', isVerified: true };
      const updated = { ...company, ...updateCompanyDto };

      mockPrisma.user.findUnique.mockResolvedValue({ ...user, company });
      mockPrisma.company.update.mockResolvedValue(updated);

      const result = await service.updateCompany('user-1', updateCompanyDto);

      expect(result.name).toBe('Updated Company');
    });

    it('should unverify company if CAC number changes', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const company = { id: 'company-1', cacNumber: 'RC123456', isVerified: true };
      const updated = { ...company, ...updateCompanyDto, isVerified: false };

      mockPrisma.user.findUnique.mockResolvedValue({ ...user, company });
      mockPrisma.company.update.mockResolvedValue(updated);

      const dtoWithNewCac = { ...updateCompanyDto, cacNumber: 'RC999999' };
      await service.updateCompany('user-1', dtoWithNewCac);

      expect(mockPrisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: false,
          }),
        })
      );
    });

    it('should keep verification if CAC number stays the same', async () => {
      const user = { id: 'user-1', companyId: 'company-1' };
      const company = { id: 'company-1', cacNumber: 'RC123456', isVerified: true };
      const updated = { ...company, ...updateCompanyDto };

      mockPrisma.user.findUnique.mockResolvedValue({ ...user, company });
      mockPrisma.company.update.mockResolvedValue(updated);

      const dtoWithSameCac = { ...updateCompanyDto, cacNumber: 'RC123456' };
      await service.updateCompany('user-1', dtoWithSameCac);

      expect(mockPrisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: true,
          }),
        })
      );
    });
  });
});