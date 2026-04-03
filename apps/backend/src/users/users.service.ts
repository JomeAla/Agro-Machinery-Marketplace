import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateCompanyDto } from './dto/users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        company: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        profile: {
          update: {
            bio: dto.bio,
            avatar: dto.avatar,
            address: dto.address,
            city: dto.city,
            state: dto.state,
          },
        },
      },
      include: {
        profile: true,
        company: true,
      },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    return this.findById(userId);
  }

  async updateCompany(userId: string, dto: UpdateCompanyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      throw new BadRequestException('User is not associated with a company');
    }

    return this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        name: dto.name,
        cacNumber: dto.cacNumber, // This triggers pending verification state if admin looks for it
        cacDocument: dto.cacDocument,
        description: dto.description,
        logo: dto.logo,
        website: dto.website,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        // Reset verification status if CAC data changes significantly (optional policy)
        isVerified: user.company?.cacNumber === dto.cacNumber ? user.company?.isVerified : false,
      },
    });
  }
}
