import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRfqDto, UpdateRfqDto, CreateQuoteDto, RfqQueryDto } from './dto/rfq.dto';
import { RfqStatus, Role } from '@prisma/client';

@Injectable()
export class RfqService {
  constructor(private prisma: PrismaService) {}

  private generateRfqNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RFQ-${timestamp}-${random}`;
  }

  async create(userId: string, dto: CreateRfqDto) {
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    return this.prisma.rfq.create({
      data: {
        rfqNumber: this.generateRfqNumber(),
        buyerId: userId,
        productId: dto.productId,
        title: dto.title,
        description: dto.description,
        quantity: dto.quantity || 1,
        budget: dto.budget,
        neededBy: dto.neededBy ? new Date(dto.neededBy) : null,
        deliveryState: dto.deliveryState,
        deliveryCity: dto.deliveryCity,
        status: RfqStatus.OPEN,
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: true,
        quotes: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(query: RfqQueryDto) {
    const { status, page = 1, limit = 10 } = query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [rfqs, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          product: true,
          _count: {
            select: { quotes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rfq.count({ where }),
    ]);

    return {
      rfqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
        product: {
          include: {
            company: true,
          },
        },
        quotes: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
              },
            },
          },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    return rfq;
  }

  async update(userId: string, id: string, dto: UpdateRfqDto) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    if (rfq.buyerId !== userId) {
      throw new ForbiddenException('You can only update your own RFQs');
    }

    return this.prisma.rfq.update({
      where: { id },
      data: {
        ...dto,
        neededBy: dto.neededBy ? new Date(dto.neededBy) : undefined,
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        quotes: true,
      },
    });
  }

  async delete(userId: string, id: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    if (rfq.buyerId !== userId) {
      throw new ForbiddenException('You can only delete your own RFQs');
    }

    await this.prisma.rfq.delete({
      where: { id },
    });

    return { message: 'RFQ deleted successfully' };
  }

  async getMyRfqs(userId: string, page = 1, limit = 10) {
    const where = { buyerId: userId };

    const [rfqs, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        include: {
          product: true,
          _count: {
            select: { quotes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rfq.count({ where }),
    ]);

    return {
      rfqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOpenRfqsForSellers(page = 1, limit = 10) {
    const where = { status: RfqStatus.OPEN };

    const [rfqs, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          product: true,
          _count: {
            select: { quotes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rfq.count({ where }),
    ]);

    return {
      rfqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createQuote(sellerId: string, dto: CreateQuoteDto) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { company: true },
    });

    if (!seller || seller.role !== Role.SELLER || !seller.companyId) {
      throw new ForbiddenException('Only sellers can submit quotes');
    }

    const rfq = await this.prisma.rfq.findUnique({
      where: { id: dto.rfqId },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    if (rfq.status !== RfqStatus.OPEN) {
      throw new ForbiddenException('Cannot quote on a closed RFQ');
    }

    return this.prisma.rfqQuote.create({
      data: {
        rfqId: dto.rfqId,
        sellerId,
        price: dto.price,
        freightCost: dto.freightCost,
        notes: dto.notes,
      },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    });
  }

  async acceptQuote(buyerId: string, quoteId: string) {
    const quote = await this.prisma.rfqQuote.findUnique({
      where: { id: quoteId },
      include: { rfq: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.rfq.buyerId !== buyerId) {
      throw new ForbiddenException('You can only accept quotes on your own RFQs');
    }

    await this.prisma.$transaction([
      this.prisma.rfqQuote.update({
        where: { id: quoteId },
        data: { isAccepted: true },
      }),
      this.prisma.rfq.update({
        where: { id: quote.rfqId },
        data: { status: RfqStatus.ACCEPTED },
      }),
    ]);

    return { message: 'Quote accepted successfully', quoteId };
  }
}
