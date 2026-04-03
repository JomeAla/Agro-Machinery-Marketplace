import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSellerStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) return null;

    const companyId = user.companyId;

    // 1. Revenue this month vs last month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [monthlyRevenue, lastMonthRevenue] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          companyId,
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
          createdAt: { gte: startOfMonth }
        },
        _sum: { total: true }
      }),
      this.prisma.order.aggregate({
        where: {
          companyId,
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
          createdAt: { gte: startOfLastMonth, lt: startOfMonth }
        },
        _sum: { total: true }
      })
    ]);

    // 2. Conversion Funnel: RFQ -> Quotes Sent -> Orders
    const [totalRfqs, quotesSent, ordersCreated] = await Promise.all([
      this.prisma.rfq.count({ where: { status: 'OPEN' } }),
      this.prisma.rfqQuote.count({ where: { sellerId: userId } }), // Quotes are sent by Users (sellers)
      this.prisma.order.count({ where: { companyId } })
    ]);

    // 3. Top Products by Views/Sales
    const topProducts = await this.prisma.product.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' }, // Placeholder for actual view count if implemented
      take: 5,
      select: {
        id: true,
        title: true,
        price: true,
        _count: {
          select: { orderItems: true }
        }
      }
    });

    // 4. Time-series: Daily Sales (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesHistory = await this.prisma.order.findMany({
      where: {
        companyId,
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    return {
      revenue: {
        currentMonth: Number(monthlyRevenue._sum.total || 0),
        pctChange: lastMonthRevenue._sum.total ? 
          (Number(monthlyRevenue._sum.total || 0) - Number(lastMonthRevenue._sum.total)) / Number(lastMonthRevenue._sum.total) * 100 
          : 0
      },
      funnel: {
        totalRfqs,
        quotesSent,
        ordersCreated,
        conversionRate: totalRfqs ? (ordersCreated / totalRfqs) * 100 : 0
      },
      topProducts,
      salesHistory,
      verificationStatus: user.company?.isVerified || false
    };
  }

  async getAdminStats() {
    const [totalUsers, totalSellers, totalRevenue, pendingVerifications] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count(),
      this.prisma.order.aggregate({
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
        _sum: { total: true }
      }),
      this.prisma.company.count({ where: { cacNumber: { not: null }, isVerified: false } })
    ]);

    return {
      totalUsers,
      totalSellers,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      pendingVerifications
    };
  }

  // ==================== Deep Dive Reporting ====================

  async getProductLineAnalytics(userId: string, filters: {
    categoryId?: string;
    productId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) return null;
    const companyId = user.companyId;

    const where: any = { companyId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.productId) where.id = filters.productId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        orderItems: {
          include: { order: true }
        }
      },
    });

    const productStats = products.map(product => {
      const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = product.orderItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
      const totalOrders = new Set(product.orderItems.map(item => item.orderId)).size;
      
      return {
        id: product.id,
        name: product.title,
        category: product.category.name,
        price: Number(product.price),
        stock: product.stockQuantity,
        totalSold,
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      };
    });

    return {
      summary: {
        totalProducts: products.length,
        totalSold: productStats.reduce((sum, p) => sum + p.totalSold, 0),
        totalRevenue: productStats.reduce((sum, p) => sum + p.totalRevenue, 0),
        totalOrders: productStats.reduce((sum, p) => sum + p.totalOrders, 0),
      },
      products: productStats.sort((a, b) => b.totalRevenue - a.totalRevenue),
    };
  }

  async getSalesTrends(userId: string, filters: {
    period?: 'day' | 'week' | 'month';
    dateFrom?: Date;
    dateTo?: Date;
    categoryId?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) return null;
    const companyId = user.companyId;

    const where: any = {
      companyId,
      status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
    };

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: { include: { category: true } } }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    const period = filters.period || 'day';
    const trends: Record<string, { revenue: number; orders: number; quantity: number }> = {};

    orders.forEach(order => {
      let key: string;
      const date = new Date(order.createdAt);
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = { revenue: 0, orders: 0, quantity: 0 };
      }
      trends[key].revenue += Number(order.total);
      trends[key].orders += 1;
      order.items.forEach(item => {
        trends[key].quantity += item.quantity;
      });
    });

    return Object.entries(trends).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  async exportReport(userId: string, format: 'csv' | 'json', filters: {
    type: 'orders' | 'products' | 'revenue';
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) return null;
    const companyId = user.companyId;

    let data: any[] = [];

    if (filters.type === 'orders') {
      const where: any = { companyId };
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const orders = await this.prisma.order.findMany({
        where,
        include: {
          buyer: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { product: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });

      data = orders.map(order => ({
        orderNumber: order.orderNumber,
        customer: `${order.buyer.firstName} ${order.buyer.lastName}`,
        customerEmail: order.buyer.email,
        items: order.items.map(i => i.product.title).join(', '),
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      }));
    } else if (filters.type === 'products') {
      const where: any = { companyId };
      if (filters.categoryId) where.categoryId = filters.categoryId;

      const products = await this.prisma.product.findMany({
        where,
        include: {
          category: true,
          orderItems: true,
        },
      });

      data = products.map(product => ({
        name: product.title,
        category: product.category.name,
        price: Number(product.price),
        stock: product.stockQuantity,
        totalSold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        totalRevenue: product.orderItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0),
        createdAt: product.createdAt.toISOString(),
      }));
    } else if (filters.type === 'revenue') {
      const where: any = {
        companyId,
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
      };
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const orders = await this.prisma.order.findMany({
        where,
        select: { orderNumber: true, total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });

      data = orders.map(order => ({
        orderNumber: order.orderNumber,
        revenue: Number(order.total),
        date: order.createdAt.toISOString(),
      }));
    }

    if (format === 'csv') {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
      return [headers.join(','), ...rows].join('\n');
    }

    return data;
  }
}
