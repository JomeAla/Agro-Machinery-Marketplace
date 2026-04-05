import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from '../auth/auth.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { FreightModule } from '../freight/freight.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AuthModule, PromotionsModule, FreightModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
