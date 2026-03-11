import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFreightQuoteDto, CalculateFreightDto, UpdateFreightStatusDto, VehicleType, NigerianStateDto } from './dto/freight.dto';

@Injectable()
export class FreightService {
  private readonly nigerianStates: NigerianStateDto[] = [
    { name: 'Abia', code: 'AB', capital: 'Umuahia', region: 'South East' },
    { name: 'Adamawa', code: 'AD', capital: 'Yola', region: 'North East' },
    { name: 'Akwa Ibom', code: 'AK', capital: 'Uyo', region: 'South South' },
    { name: 'Anambra', code: 'AN', capital: 'Awka', region: 'South East' },
    { name: 'Bauchi', code: 'BA', capital: 'Bauchi', region: 'North East' },
    { name: 'Bayelsa', code: 'BY', capital: 'Yenagoa', region: 'South South' },
    { name: 'Benue', code: 'BE', capital: 'Makurdi', region: 'North Central' },
    { name: 'Borno', code: 'BR', capital: 'Maiduguri', region: 'North East' },
    { name: 'Cross River', code: 'CR', capital: 'Calabar', region: 'South South' },
    { name: 'Delta', code: 'DE', capital: 'Asaba', region: 'South South' },
    { name: 'Ebonyi', code: 'EB', capital: 'Abakaliki', region: 'South East' },
    { name: 'Edo', code: 'ED', capital: 'Benin', region: 'South South' },
    { name: 'Ekiti', code: 'EK', capital: 'Ado Ekiti', region: 'South West' },
    { name: 'Enugu', code: 'EN', capital: 'Enugu', region: 'South East' },
    { name: 'Gombe', code: 'GO', capital: 'Gombe', region: 'North East' },
    { name: 'Imo', code: 'IM', capital: 'Owerri', region: 'South East' },
    { name: 'Jigawa', code: 'JI', capital: 'Dutse', region: 'North West' },
    { name: 'Kaduna', code: 'KD', capital: 'Kaduna', region: 'North West' },
    { name: 'Kano', code: 'KN', capital: 'Kano', region: 'North West' },
    { name: 'Katsina', code: 'KT', capital: 'Katsina', region: 'North West' },
    { name: 'Kebbi', code: 'KE', capital: 'Birnin Kebbi', region: 'North West' },
    { name: 'Kogi', code: 'KG', capital: 'Okene', region: 'North Central' },
    { name: 'Kwara', code: 'KW', capital: 'Ilorin', region: 'North Central' },
    { name: 'Lagos', code: 'LA', capital: 'Ikeja', region: 'South West' },
    { name: 'Nasarawa', code: 'NA', capital: 'Lafia', region: 'North Central' },
    { name: 'Niger', code: 'NI', capital: 'Minna', region: 'North Central' },
    { name: 'Ogun', code: 'OG', capital: 'Abeokuta', region: 'South West' },
    { name: 'Ondo', code: 'ON', capital: 'Akure', region: 'South West' },
    { name: 'Osun', code: 'OS', capital: 'Osogbo', region: 'South West' },
    { name: 'Oyo', code: 'OY', capital: 'Ibadan', region: 'South West' },
    { name: 'Plateau', code: 'PL', capital: 'Jos', region: 'North Central' },
    { name: 'Rivers', code: 'RI', capital: 'Port Harcourt', region: 'South South' },
    { name: 'Sokoto', code: 'SO', capital: 'Sokoto', region: 'North West' },
    { name: 'Taraba', code: 'TA', capital: 'Jalingo', region: 'North East' },
    { name: 'Yobe', code: 'YO', capital: 'Damaturu', region: 'North East' },
    { name: 'Zamfara', code: 'ZA', capital: 'Gusau', region: 'North West' },
    { name: 'FCT', code: 'FC', capital: 'Abuja', region: 'North Central' },
  ];

  private readonly baseRates: Record<VehicleType, number> = {
    [VehicleType.LOWBED]: 150000,
    [VehicleType.FLATBED]: 120000,
    [VehicleType.TRUCK]: 80000,
    [VehicleType.PICKUP]: 35000,
  };

  private readonly distanceMultipliers: Record<string, Record<string, number>> = {
    'North West': {
      'North West': 1.0,
      'North East': 1.3,
      'North Central': 1.2,
      'South West': 1.8,
      'South East': 1.9,
      'South South': 2.0,
    },
    'North East': {
      'North West': 1.3,
      'North East': 1.0,
      'North Central': 1.1,
      'South West': 2.0,
      'South East': 1.7,
      'South South': 1.9,
    },
    'North Central': {
      'North West': 1.2,
      'North East': 1.1,
      'North Central': 1.0,
      'South West': 1.5,
      'South East': 1.4,
      'South South': 1.6,
    },
    'South West': {
      'North West': 1.8,
      'North East': 2.0,
      'North Central': 1.5,
      'South West': 1.0,
      'South East': 1.2,
      'South South': 1.4,
    },
    'South East': {
      'North West': 1.9,
      'North East': 1.7,
      'North Central': 1.4,
      'South West': 1.2,
      'South East': 1.0,
      'South South': 1.1,
    },
    'South South': {
      'North West': 2.0,
      'North East': 1.9,
      'North Central': 1.6,
      'South West': 1.4,
      'South East': 1.1,
      'South South': 1.0,
    },
  };

  constructor(private prisma: PrismaService) {}

  getNigerianStates(): NigerianStateDto[] {
    return this.nigerianStates;
  }

  calculateFreight(dto: CalculateFreightDto): any {
    const originState = this.nigerianStates.find(
      s => s.name.toLowerCase() === dto.originState.toLowerCase()
    );
    const destState = this.nigerianStates.find(
      s => s.name.toLowerCase() === dto.destinationState.toLowerCase()
    );

    if (!originState || !destState) {
      throw new BadRequestException('Invalid state provided');
    }

    const baseRate = this.baseRates[dto.vehicleType];
    const distanceMultiplier = this.distanceMultipliers[originState.region][destState.region];
    
    let weightMultiplier = 1.0;
    if (dto.weight && dto.weight > 5000) {
      weightMultiplier = 1 + ((dto.weight - 5000) / 10000);
    }

    const units = dto.units || 1;
    const unitMultiplier = 1 + (units - 1) * 0.2;

    const estimatedCost = Math.round(
      baseRate * distanceMultiplier * weightMultiplier * unitMultiplier
    );

    const estimatedDays = this.estimateDeliveryDays(originState.region, destState.region);

    return {
      origin: {
        state: originState.name,
        region: originState.region,
      },
      destination: {
        state: destState.name,
        region: destState.region,
      },
      vehicleType: dto.vehicleType as any,
      estimatedCost,
      baseRate,
      distanceMultiplier,
      weightMultiplier: dto.weight ? weightMultiplier : 1,
      unitMultiplier,
      estimatedDays,
      breakdown: {
        baseDistanceCost: Math.round(baseRate * distanceMultiplier),
        weightAdjustment: dto.weight ? Math.round(baseRate * distanceMultiplier * (weightMultiplier - 1)) : 0,
        unitAdjustment: Math.round(baseRate * distanceMultiplier * (unitMultiplier - 1)),
      },
    };
  }

  private estimateDeliveryDays(originRegion: string, destRegion: string): string {
    if (originRegion === destRegion) {
      return '1-2 days';
    }
    if (originRegion === 'South West' && destRegion === 'North West') {
      return '3-4 days';
    }
    if (originRegion === 'South South' || originRegion === 'South East') {
      return '4-5 days';
    }
    return '3-5 days';
  }

  async createQuote(userId: string, dto: CreateFreightQuoteDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      throw new BadRequestException('Only sellers can create freight quotes');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.companyId !== user.companyId) {
      throw new ForbiddenException('You can only quote freight for your own orders');
    }

    const freightQuote = await this.prisma.freightQuote.create({
      data: {
        orderId: dto.orderId,
        sellerId: userId,
        originState: dto.originState,
        destinationState: dto.destinationState,
        vehicleType: dto.vehicleType as any,
        cost: dto.cost,
        estimatedDays: dto.estimatedDays,
        notes: dto.notes,
      },
      include: {
        order: true,
      },
    });

    const total = Number(order.total) + dto.cost;
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        freightCost: dto.cost,
        total,
      },
    });

    return freightQuote;
  }

  async getQuotesByOrder(orderId: string) {
    return this.prisma.freightQuote.findMany({
      where: { orderId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(quoteId: string, userId: string, dto: UpdateFreightStatusDto) {
    const quote = await this.prisma.freightQuote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundException('Freight quote not found');
    }

    if (quote.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own quotes');
    }

    return this.prisma.freightQuote.update({
      where: { id: quoteId },
      data: { status: dto.status },
    });
  }
}

import { ForbiddenException } from '@nestjs/common';
