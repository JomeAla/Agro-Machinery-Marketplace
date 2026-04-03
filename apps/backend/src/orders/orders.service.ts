import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/orders.dto';
import { OrderStatus } from '@prisma/client';
import { PromotionsService } from '../promotions/promotions.service';
import { FreightService } from '../freight/freight.service';
import { VehicleType } from '../freight/dto/freight.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private promotions: PromotionsService,
    private freight: FreightService,
    private payments: PaymentsService,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async create(userId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine target products and calculate subtotal
    const productItems = [];
    let subtotal = 0;

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.items.map(item => item.productId) },
        inStock: true,
      },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('One or more products are not available');
    }

    const orderItems = [];

    for (const item of dto.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        total: itemTotal,
      });
    }

    // Handle Discount/Promotions
    let discountAmount = 0;
    if (dto.discountCode) {
      const discountResult = await this.promotions.validateDiscountCode(dto.discountCode, subtotal);
      discountAmount = discountResult.discountAmount;
      
      // Update usage count for the code
      await this.prisma.discountCode.update({
        where: { code: dto.discountCode },
        data: { usedCount: { increment: 1 } }
      });
    }

    // Handle Freight Calculation
    let freightCost = 0;
    if (dto.shippingState && products.length > 0) {
      // Get the first seller's company state as origin
      const company = await this.prisma.company.findUnique({
        where: { id: products[0].companyId },
      });

      if (company?.state) {
        try {
          const freightResult = this.freight.calculateFreight({
            originState: company.state,
            destinationState: dto.shippingState,
            vehicleType: VehicleType.PICKUP, // Default vehicle type
            units: dto.items.reduce((acc, i) => acc + i.quantity, 0),
          });
          freightCost = freightResult.estimatedCost;
        } catch (e) {
          console.error('Freight calculation failed during order creation:', e.message);
          // Fallback to 0 if state not found or other error
        }
      }
    }

    const finalTotal = Number(subtotal) - Number(discountAmount) + Number(freightCost);

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        buyerId: userId,
        companyId: products[0]?.companyId || '',
        subtotal,
        discountCode: dto.discountCode || null,
        discountAmount,
        freightCost,
        total: finalTotal,
        shippingAddress: dto.shippingAddress,
        shippingState: dto.shippingState,
        notes: dto.notes,
        status: OrderStatus.PENDING,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return order;
  }

  async findAll(query: OrderQueryDto) {
    const { status, page = 1, limit = 10 } = query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        company: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getMyOrders(userId: string, page = 1, limit = 10) {
    const where = { buyerId: userId };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSellerOrders(userId: string, page = 1, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      throw new ForbiddenException('Only sellers can view their orders');
    }

    const where = { companyId: user.companyId };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(orderId: string, userId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { company: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    const isSeller = user?.companyId === order.companyId;
    const isBuyer = order.buyerId === userId;

    if (!isSeller && !isBuyer) {
      throw new ForbiddenException('You can only update orders you are involved in');
    }

    if (dto.status === OrderStatus.DELIVERED && isBuyer) {
        // Automatically release escrow when buyer confirms delivery
        const escrow = await this.prisma.escrow.findUnique({
            where: { orderId: order.id }
        });
        if (escrow && escrow.status === 'held') {
            await this.payments.releaseEscrow(escrow.id);
        }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async calculateFreight(orderId: string, sellerId: string, freightCost: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { company: true },
    });

    if (user?.companyId !== order.companyId) {
      throw new ForbiddenException('You can only update freight for your own orders');
    }

    const total = Number(order.subtotal) + freightCost;

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        freightCost,
        total,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async openDispute(userId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException('You can only open disputes for your own orders');
    }

    if (order.status !== 'DELIVERED' && order.status !== 'SHIPPED') {
      throw new BadRequestException('You can only open disputes for shipped or delivered orders');
    }

    if (order.disputeStatus === 'OPEN') {
      throw new BadRequestException('Dispute is already open for this order');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        disputeStatus: 'OPEN',
        disputeReason: reason,
      },
    });
  }

  async getMyDisputes(userId: string) {
    return this.prisma.order.findMany({
      where: {
        buyerId: userId,
        disputeStatus: { not: null },
      },
      include: {
        items: { include: { product: true } },
        company: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getDisputeDetails(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        items: { include: { product: true } },
        company: true,
      },
    });
  }
}
