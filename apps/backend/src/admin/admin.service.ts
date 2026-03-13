import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { 
  AdminUserQueryDto, 
  UpdateUserStatusDto,
  ProductModerationDto,
  OrderQueryDto,
  ResolveDisputeDto 
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== Analytics ====================
  
  async getAnalytics() {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalOrders,
      totalProducts,
      pendingProducts,
      activeProducts,
      totalRevenue,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'BUYER' } }),
      this.prisma.user.count({ where: { role: 'SELLER' } }),
      this.prisma.order.count(),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { status: 'APPROVED' } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { buyer: true, company: true },
      }),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { company: true },
      }),
    ]);

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await this.prisma.order.groupBy({
      by: ['createdAt'],
      _sum: { total: true },
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: sixMonthsAgo },
      },
    });

    // Get category distribution
    const categoryDistribution = await this.prisma.product.groupBy({
      by: ['categoryId'],
      _count: true,
      where: { status: 'APPROVED' },
    });

    const categories = await this.prisma.categoryModel.findMany({
      where: { id: { in: categoryDistribution.map(c => c.categoryId) } },
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    return {
      totalUsers,
      totalBuyers,
      totalSellers,
      totalOrders,
      totalProducts,
      pendingProducts,
      activeProducts,
      totalRevenue: totalRevenue._sum.total || 0,
      recentOrders: recentOrders.map(order => ({
        ...order,
        buyerName: order.buyer.firstName + ' ' + order.buyer.lastName,
        sellerName: order.company?.name,
      })),
      recentUsers: recentUsers.map(user => ({
        ...user,
        companyName: user.company?.name,
      })),
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: m.createdAt.toISOString().slice(0, 7),
        revenue: m._sum.total || 0,
      })),
      categoryDistribution: categoryDistribution.map(c => ({
        category: categoryMap[c.categoryId] || 'Unknown',
        count: c._count,
      })),
    };
  }

  // ==================== User Management ====================

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getUsers(query: AdminUserQueryDto) {
    const { page = 1, limit = 20, role, isActive, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { company: true, profile: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { 
        company: true, 
        profile: true,
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        products: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - just deactivate
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== Product Moderation ====================

  async getProducts(query: ProductModerationDto) {
    const { page = 1, limit = 20, status, search, categoryId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { 
          category: true, 
          seller: { include: { company: true } },
          company: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async rejectProduct(id: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });
  }

  async flagProduct(id: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { 
        status: 'FLAGGED',
        rejectionReason: reason,
      },
    });
  }

  // ==================== Order Management ====================

  async getOrders(query: OrderQueryDto) {
    const { page = 1, limit = 20, status, search, disputeStatus } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (disputeStatus) {
      where.disputeStatus = disputeStatus;
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { 
          buyer: true, 
          company: true,
          items: { include: { product: true } },
          payment: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { 
        buyer: true, 
        company: true,
        items: { include: { product: true } },
        payment: true,
        escrow: true,
        freightQuotes: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async resolveDispute(id: string, dto: ResolveDisputeDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: { 
        disputeStatus: 'RESOLVED',
        disputeReason: dto.resolution,
        resolvedAt: new Date(),
      },
    });
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      yesterdayOrders,
      pendingDisputes,
      newUsersToday,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { 
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
          createdAt: { gte: today },
        },
      }),
      this.prisma.order.count({
        where: { 
          createdAt: { 
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lt: today,
          } 
        },
      }),
      this.prisma.order.count({
        where: { disputeStatus: 'OPEN' },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    return {
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      yesterdayOrders,
      pendingDisputes,
      newUsersToday,
      orderChange: yesterdayOrders > 0 
        ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1)
        : 0,
    };
  }

  // ==================== Transaction Management ====================

  async getTransactions(query: { page?: number; limit?: number; status?: string; provider?: string; search?: string }) {
    const { page = 1, limit = 20, status, provider, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (provider) {
      where.provider = provider;
    }
    
    if (search) {
      where.providerRef = { contains: search, mode: 'insensitive' };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { 
          order: { 
            include: { 
              buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
              company: { select: { name: true } }
            } 
          } 
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { 
        order: { 
          include: { 
            buyer: true,
            company: true,
            items: { include: { product: true } },
          } 
        } 
      },
    });

    if (!payment) {
      throw new NotFoundException('Transaction not found');
    }

    return payment;
  }

  async processRefund(paymentId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'REFUNDED') {
      throw new ForbiddenException('Payment already refunded');
    }

    if (payment.status !== 'SUCCESS') {
      throw new ForbiddenException('Can only refund successful payments');
    }

    // Update payment status to refunded
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'CANCELLED' },
    });

    return updatedPayment;
  }

  async getRefundHistory(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: 'REFUNDED' },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { 
          order: { 
            include: { 
              buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
            } 
          } 
        },
      }),
      this.prisma.payment.count({ where: { status: 'REFUNDED' } }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
