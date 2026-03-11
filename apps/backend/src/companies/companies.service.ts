import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/companies.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCompanyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.SELLER) {
      throw new ForbiddenException('Only sellers can create companies');
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        cacNumber: dto.cacNumber,
        description: dto.description,
        logo: dto.logo,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        website: dto.website,
        phone: dto.phone,
        email: dto.email,
        isVerified: false,
        users: {
          connect: { id: userId },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return company;
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(userId: string, companyId: string, dto: UpdateCompanyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || user.companyId !== companyId) {
      throw new ForbiddenException('You can only update your own company');
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getMyCompany(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      throw new NotFoundException('Company not found');
    }

    return this.findById(user.companyId);
  }

  async verifyCompany(companyId: string, isVerified: boolean) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
      },
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      where: { isVerified: true },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
