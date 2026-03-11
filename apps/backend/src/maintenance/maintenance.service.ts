import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateManualDto, 
  CreateMaintenanceScheduleDto, 
  CreateMaintenanceRecordDto,
  CreateWarrantyClaimDto,
  UpdateWarrantyClaimDto 
} from './dto/maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async addManual(userId: string, dto: CreateManualDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('You can only add manuals to your own products');
    }

    return this.prisma.productManual.create({
      data: {
        productId: dto.productId,
        title: dto.title,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
      },
    });
  }

  async getManuals(productId: string) {
    return this.prisma.productManual.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteManual(userId: string, manualId: string) {
    const manual = await this.prisma.productManual.findUnique({
      where: { id: manualId },
      include: { product: true },
    });

    if (!manual) {
      throw new NotFoundException('Manual not found');
    }

    if (manual.product.sellerId !== userId) {
      throw new ForbiddenException('You can only delete manuals from your own products');
    }

    await this.prisma.productManual.delete({
      where: { id: manualId },
    });

    return { message: 'Manual deleted successfully' };
  }

  async createSchedule(userId: string, dto: CreateMaintenanceScheduleDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('You can only create schedules for your own products');
    }

    return this.prisma.maintenanceSchedule.create({
      data: {
        productId: dto.productId,
        title: dto.title,
        description: dto.description,
        maintenanceType: dto.maintenanceType as any,
        intervalHours: dto.intervalHours,
        notes: dto.notes,
      },
    });
  }

  async getSchedules(productId: string) {
    return this.prisma.maintenanceSchedule.findMany({
      where: { productId },
      orderBy: { intervalHours: 'asc' },
    });
  }

  async deleteSchedule(userId: string, scheduleId: string) {
    const schedule = await this.prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
      include: { product: true },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.product.sellerId !== userId) {
      throw new ForbiddenException('You can only delete schedules from your own products');
    }

    await this.prisma.maintenanceSchedule.delete({
      where: { id: scheduleId },
    });

    return { message: 'Schedule deleted successfully' };
  }

  async createRecord(userId: string, dto: CreateMaintenanceRecordDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        items: {
          some: {
            productId: dto.productId,
          },
        },
        buyerId: userId,
      },
    });

    if (!order && product.sellerId !== userId) {
      throw new ForbiddenException('You can only create records for products you purchased or sell');
    }

    return this.prisma.maintenanceRecord.create({
      data: {
        productId: dto.productId,
        scheduleId: dto.scheduleId,
        maintenanceType: dto.maintenanceType as any,
        description: dto.description,
        performedAt: new Date(dto.performedAt),
        serviceProvider: dto.serviceProvider,
        cost: dto.cost,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async getRecords(productId: string) {
    return this.prisma.maintenanceRecord.findMany({
      where: { productId },
      include: {
        schedule: true,
      },
      orderBy: { performedAt: 'desc' },
    });
  }

  async createWarrantyClaim(userId: string, dto: CreateWarrantyClaimDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        items: {
          some: {
            productId: dto.productId,
          },
        },
        buyerId: userId,
      },
    });

    if (!order) {
      throw new ForbiddenException('You can only claim warranty for products you purchased');
    }

    if (!product.warrantyMonths || product.warrantyMonths <= 0) {
      throw new BadRequestException('This product does not have warranty');
    }

    const purchaseDate = order.createdAt;
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + product.warrantyMonths);

    if (new Date() > warrantyEndDate) {
      throw new BadRequestException('Warranty period has expired');
    }

    return this.prisma.warrantyClaim.create({
      data: {
        userId,
        productId: dto.productId,
        orderId: dto.orderId,
        issue: dto.issue,
        description: dto.description,
        images: dto.images || [],
        status: 'pending',
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            warrantyMonths: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getMyClaims(userId: string) {
    return this.prisma.warrantyClaim.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            warrantyMonths: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllClaims() {
    return this.prisma.warrantyClaim.findMany({
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
            warrantyMonths: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateClaimStatus(claimId: string, dto: UpdateWarrantyClaimDto) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return this.prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes,
        processedAt: new Date(),
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

  async getWarrantyStatus(productId: string, orderId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!product.warrantyMonths || product.warrantyMonths <= 0) {
      return {
        hasWarranty: false,
        message: 'This product does not have warranty coverage',
      };
    }

    const purchaseDate = order.createdAt;
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + product.warrantyMonths);

    const now = new Date();
    const isActive = now < warrantyEndDate;
    const daysRemaining = Math.ceil((warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      hasWarranty: true,
      isActive,
      warrantyMonths: product.warrantyMonths,
      purchaseDate,
      warrantyEndDate,
      daysRemaining: isActive ? daysRemaining : 0,
      message: isActive 
        ? `Warranty active - ${daysRemaining} days remaining`
        : 'Warranty has expired',
    };
  }
}
