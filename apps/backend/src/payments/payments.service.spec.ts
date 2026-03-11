import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let settingsService: SettingsService;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    escrow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSettingsService = {
    getSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    settingsService = module.get<SettingsService>(SettingsService);

    jest.clearAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ status: true, data: { authorization_url: 'https://paystack.url', reference: 'ref123' } }),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initializePayment', () => {
    const initializeDto = {
      orderId: 'order-1',
      amount: 15000000,
      currency: 'NGN',
      customerEmail: 'buyer@example.com',
      customerName: 'John Doe',
      customerPhone: '+2348012345678',
    };

    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      mockSettingsService.getSettings.mockResolvedValue({ paymentProvider: 'PAYSTACK' });

      await expect(service.initializePayment(initializeDto)).rejects.toThrow(NotFoundException);
    });

    it('should initialize payment with Paystack successfully', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001' };
      const payment = { id: 'payment-1', provider: 'PAYSTACK', providerRef: 'ref123' };
      const settings = {
        paymentProvider: 'PAYSTACK',
        paystackConfig: { secretKey: 'test-secret-key', isActive: true },
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.payment.create.mockResolvedValue(payment);
      mockSettingsService.getSettings.mockResolvedValue(settings);

      const result = await service.initializePayment(initializeDto);

      expect(result.paymentId).toBe('payment-1');
      expect(result.provider).toBe('PAYSTACK');
      expect(result.providerRef).toBe('ref123');
    });

    it('should initialize payment with Flutterwave successfully', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001' };
      const payment = { id: 'payment-1', provider: 'FLUTTERWAVE', providerRef: 'flw_ref123' };
      const settings = {
        paymentProvider: 'FLUTTERWAVE',
        flutterwaveConfig: { secretKey: 'test-secret-key', isActive: true },
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.payment.create.mockResolvedValue(payment);
      mockSettingsService.getSettings.mockResolvedValue(settings);
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve({ status: 'success', data: { link: 'https://flutterwave.url', tx_ref: 'flw_ref123' } }),
      } as any);

      const result = await service.initializePayment(initializeDto);

      expect(result.provider).toBe('FLUTTERWAVE');
    });

    it('should throw BadRequestException if Paystack not configured', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001' };
      const settings = {
        paymentProvider: 'PAYSTACK',
        paystackConfig: null,
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockSettingsService.getSettings.mockResolvedValue(settings);

      await expect(service.initializePayment(initializeDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if Flutterwave not configured', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001' };
      const settings = {
        paymentProvider: 'FLUTTERWAVE',
        flutterwaveConfig: null,
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockSettingsService.getSettings.mockResolvedValue(settings);

      await expect(service.initializePayment(initializeDto)).rejects.toThrow(BadRequestException);
    });

    it('should create escrow if enabled', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001' };
      const payment = { id: 'payment-1', provider: 'PAYSTACK', providerRef: 'ref123' };
      const settings = {
        paymentProvider: 'PAYSTACK',
        paystackConfig: { secretKey: 'test-secret-key', isActive: true },
        escrowEnabled: true,
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.payment.create.mockResolvedValue(payment);
      mockSettingsService.getSettings.mockResolvedValue(settings);

      const result = await service.initializePayment(initializeDto);
      expect(result).toBeDefined();
    });
  });

  describe('verifyPayment', () => {
    it('should throw BadRequestException if verification fails', async () => {
      const settings = {
        paymentProvider: 'PAYSTACK',
        paystackConfig: { secretKey: 'test-secret-key' },
      };

      mockSettingsService.getSettings.mockResolvedValue(settings);
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve({ status: false, message: 'Verification failed' }),
      } as any);

      await expect(service.verifyPayment('invalid-ref')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment record not found', async () => {
      const settings = {
        paymentProvider: 'PAYSTACK',
        paystackConfig: { secretKey: 'test-secret-key' },
      };

      mockSettingsService.getSettings.mockResolvedValue(settings);
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve({ status: true, data: { reference: 'ref123' } }),
      } as any);
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.verifyPayment('ref123')).rejects.toThrow(NotFoundException);
    });

    it('should verify payment successfully', async () => {
      const payment = { id: 'payment-1', orderId: 'order-1', amount: 15000000, provider: 'PAYSTACK' };
      const settings = {
        paymentProvider: 'PAYSTACK',
        paystackConfig: { secretKey: 'test-secret-key' },
        escrowEnabled: false,
      };

      mockSettingsService.getSettings.mockResolvedValue(settings);
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve({ status: true, data: { reference: 'ref123' } }),
      } as any);
      mockPrisma.payment.findFirst.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({ ...payment, status: 'success' });
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'PAID' });

      const result = await service.verifyPayment('ref123');

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('payment-1');
    });

    it('should create escrow after successful payment', async () => {
      const payment = { id: 'payment-1', orderId: 'order-1', amount: 15000000, provider: 'PAYSTACK' };
      const order = { id: 'order-1', orderNumber: 'ORD001', company: { id: 'company-1' } };
      const settings = {
        paymentProvider: 'PAYSTACK',
        paystackConfig: { secretKey: 'test-secret-key' },
        escrowEnabled: true,
      };
      const escrow = { id: 'escrow-1', orderId: 'order-1', amount: 15000000 };

      mockSettingsService.getSettings.mockResolvedValue(settings);
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve({ status: true, data: { reference: 'ref123' } }),
      } as any);
      mockPrisma.payment.findFirst.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({ ...payment, status: 'success' });
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'PAID' });
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.escrow.create.mockResolvedValue(escrow);

      const result = await service.verifyPayment('ref123');

      expect(mockPrisma.escrow.create).toHaveBeenCalled();
    });
  });

  describe('createEscrow', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.createEscrow('order-1', 15000000, 'PAYSTACK')).rejects.toThrow(NotFoundException);
    });

    it('should create escrow successfully', async () => {
      const order = { id: 'order-1', orderNumber: 'ORD001', company: { id: 'company-1' } };
      const escrow = { id: 'escrow-1', orderId: 'order-1', amount: 15000000, status: 'held' };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.escrow.create.mockResolvedValue(escrow);

      const result = await service.createEscrow('order-1', 15000000, 'PAYSTACK');

      expect(result.id).toBe('escrow-1');
      expect(result.status).toBe('held');
    });
  });

  describe('releaseEscrow', () => {
    it('should throw NotFoundException if escrow not found', async () => {
      mockPrisma.escrow.findUnique.mockResolvedValue(null);

      await expect(service.releaseEscrow('escrow-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if escrow not in held status', async () => {
      mockPrisma.escrow.findUnique.mockResolvedValue({ id: 'escrow-1', status: 'released' });

      await expect(service.releaseEscrow('escrow-1')).rejects.toThrow(BadRequestException);
    });

    it('should release escrow successfully', async () => {
      const escrow = { id: 'escrow-1', status: 'held', provider: 'PAYSTACK' };
      const releasedEscrow = { ...escrow, status: 'released', releasedAt: new Date() };

      mockPrisma.escrow.findUnique.mockResolvedValue(escrow);
      mockPrisma.escrow.update.mockResolvedValue(releasedEscrow);

      const result = await service.releaseEscrow('escrow-1');

      expect(result.status).toBe('released');
    });
  });

  describe('handleWebhook', () => {
    it('should handle Paystack charge.success event', async () => {
      const payload = {
        event: 'charge.success',
        data: { reference: 'ref123' },
      };
      const verifyPaymentSpy = jest.spyOn(service, 'verifyPayment').mockResolvedValue({ success: true, paymentId: 'payment-1' });

      const result = await service.handleWebhook('paystack', payload);

      expect(verifyPaymentSpy).toHaveBeenCalledWith('ref123');
      expect(result.received).toBe(true);
      verifyPaymentSpy.mockRestore();
    });

    it('should handle Flutterwave charge.completed event', async () => {
      const payload = {
        event: 'charge.completed',
        data: { tx_ref: 'flw_ref123' },
      };
      const verifyPaymentSpy = jest.spyOn(service, 'verifyPayment').mockResolvedValue({ success: true, paymentId: 'payment-1' });

      const result = await service.handleWebhook('flutterwave', payload);

      expect(verifyPaymentSpy).toHaveBeenCalledWith('flw_ref123');
      expect(result.received).toBe(true);
      verifyPaymentSpy.mockRestore();
    });

    it('should ignore other events', async () => {
      const payload = { event: 'other.event', data: {} };
      const verifyPaymentSpy = jest.spyOn(service, 'verifyPayment').mockResolvedValue({ success: true, paymentId: 'payment-1' });

      const result = await service.handleWebhook('paystack', payload);

      expect(result.received).toBe(true);
      expect(verifyPaymentSpy).not.toHaveBeenCalled();
      verifyPaymentSpy.mockRestore();
    });
  });

  describe('getPaymentByOrder', () => {
    it('should return payment for order', async () => {
      const payment = { id: 'payment-1', orderId: 'order-1' };
      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      const result = await service.getPaymentByOrder('order-1');

      expect(result).toEqual(payment);
    });
  });

  describe('getEscrowByOrder', () => {
    it('should return escrow for order', async () => {
      const escrow = { id: 'escrow-1', orderId: 'order-1' };
      mockPrisma.escrow.findUnique.mockResolvedValue(escrow);

      const result = await service.getEscrowByOrder('order-1');

      expect(result).toEqual(escrow);
    });
  });
});