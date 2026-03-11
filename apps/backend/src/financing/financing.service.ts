import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinancingRequestDto, UpdateFinancingStatusDto, FinancingQueryDto, CalculateInstallmentDto } from './dto/financing.dto';
import { FinancingStatus, FinancingType } from '@prisma/client';

@Injectable()
export class FinancingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFinancingRequestDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.financingRequest.create({
      data: {
        userId,
        productId: dto.productId,
        financingType: dto.financingType as FinancingType,
        amount: dto.amount,
        tenureMonths: dto.tenureMonths,
        purpose: dto.purpose,
        state: dto.state,
        city: dto.city,
        status: FinancingStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
    });
  }

  async findAll(query: FinancingQueryDto) {
    const { status, page = 1, limit = 10 } = query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      this.prisma.financingRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.financingRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const request = await this.prisma.financingRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
        product: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Financing request not found');
    }

    return request;
  }

  async getMyRequests(userId: string, page = 1, limit = 10) {
    const where = { userId };

    const [requests, total] = await Promise.all([
      this.prisma.financingRequest.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.financingRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, dto: UpdateFinancingStatusDto) {
    const request = await this.prisma.financingRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Financing request not found');
    }

    return this.prisma.financingRequest.update({
      where: { id },
      data: {
        status: dto.status as FinancingStatus,
        adminNotes: dto.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  calculateInstallment(dto: CalculateInstallmentDto) {
    const principal = dto.amount;
    const months = dto.tenureMonths;
    const annualRate = dto.interestRate || 15;
    const monthlyRate = annualRate / 100 / 12;

    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    return {
      principal,
      tenureMonths: months,
      interestRate: annualRate,
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      amortizationSchedule: this.generateAmortizationSchedule(
        principal,
        monthlyRate,
        months,
        monthlyPayment
      ),
    };
  }

  private generateAmortizationSchedule(
    principal: number,
    monthlyRate: number,
    months: number,
    monthlyPayment: number
  ) {
    const schedule = [];
    let balance = principal;

    for (let month = 1; month <= months; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: Math.round(monthlyPayment),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(Math.max(0, balance)),
      });
    }

    return schedule;
  }

  async getProviders() {
    return [
      {
        id: 'agrifinance',
        name: 'Agrifinance Nigeria',
        description: 'Specialized agricultural equipment financing',
        website: 'https://agrifinance.ng',
        supportedTypes: ['LEASE', 'INSTALLMENT', 'LOAN'],
      },
      {
        id: 'firstbank',
        name: 'First Bank of Nigeria',
        description: 'Agricultural loans and financing',
        website: 'https://firstbank.ng',
        supportedTypes: ['LOAN'],
      },
      {
        id: 'sterling',
        name: 'Sterling Bank',
        description: 'Agri-business financing solutions',
        website: 'https://sterling.ng',
        supportedTypes: ['INSTALLMENT', 'LOAN'],
      },
    ];
  }
}
