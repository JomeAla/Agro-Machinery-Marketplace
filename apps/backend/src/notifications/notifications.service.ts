import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  RFQ_RECEIVED = 'RFQ_RECEIVED',
  RFQ_QUOTE_RECEIVED = 'RFQ_QUOTE_RECEIVED',
  WARRANTY_CLAIM_UPDATE = 'WARRANTY_CLAIM_UPDATE',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  SYSTEM = 'SYSTEM',
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || {},
      },
    });
  }

  async createMany(notifications: CreateNotificationDto[]) {
    if (notifications.length === 0) return [];
    
    return this.prisma.notification.createMany({
      data: notifications.map(dto => ({
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || {},
      })),
    });
  }

  async getForUser(userId: string, options?: { unreadOnly?: boolean; limit?: number; offset?: number }) {
    const where: any = { userId };
    
    if (options?.unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async deleteOld(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      },
    });
  }

  async notifyOrderPlaced(userId: string, orderData: { orderId: string; productName: string; total: number }) {
    return this.create({
      userId,
      type: NotificationType.ORDER_PLACED,
      title: 'Order Placed',
      message: `Your order for ${orderData.productName} (₦${orderData.total.toLocaleString()}) has been placed.`,
      data: { orderId: orderData.orderId },
    });
  }

  async notifyOrderShipped(userId: string, orderData: { orderId: string; productName: string; trackingNumber?: string }) {
    return this.create({
      userId,
      type: NotificationType.ORDER_SHIPPED,
      title: 'Order Shipped',
      message: `Your order for ${orderData.productName} has been shipped.${orderData.trackingNumber ? ` Tracking: ${orderData.trackingNumber}` : ''}`,
      data: { orderId: orderData.orderId },
    });
  }

  async notifyPaymentReceived(userId: string, amount: number, orderId?: string) {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `Payment of ₦${amount.toLocaleString()} has been received.`,
      data: { orderId },
    });
  }

  async notifyRfqReceived(sellerId: string, rfqData: { rfqId: string; title: string; buyerName: string }) {
    return this.create({
      userId: sellerId,
      type: NotificationType.RFQ_RECEIVED,
      title: 'New RFQ Received',
      message: `You received a new RFQ from ${rfqData.buyerName}: ${rfqData.title}`,
      data: { rfqId: rfqData.rfqId },
    });
  }

  async notifyWarrantyClaimUpdate(userId: string, claimData: { claimId: string; status: string; productName: string }) {
    return this.create({
      userId,
      type: NotificationType.WARRANTY_CLAIM_UPDATE,
      title: 'Warranty Claim Updated',
      message: `Your warranty claim for ${claimData.productName} has been ${claimData.status.toLowerCase()}.`,
      data: { claimId: claimData.claimId },
    });
  }

  async notifyVerificationStatus(userId: string, approved: boolean, companyName: string) {
    return this.create({
      userId,
      type: approved ? NotificationType.VERIFICATION_APPROVED : NotificationType.VERIFICATION_REJECTED,
      title: approved ? 'Verification Approved' : 'Verification Rejected',
      message: approved 
        ? `Congratulations! ${companyName} has been verified.`
        : `Your verification for ${companyName} was not approved. Please check and resubmit.`,
      data: {},
    });
  }

  async notifyReviewReceived(sellerId: string, reviewData: { reviewId: string; productName: string; rating: number }) {
    return this.create({
      userId: sellerId,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'New Review',
      message: `You received a ${reviewData.rating}-star review for ${reviewData.productName}.`,
      data: { reviewId: reviewData.reviewId },
    });
  }
}
