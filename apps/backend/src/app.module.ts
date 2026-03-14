import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { RfqModule } from './rfq/rfq.module';
import { OrdersModule } from './orders/orders.module';
import { SettingsModule } from './settings/settings.module';
import { PaymentsModule } from './payments/payments.module';
import { MessagingModule } from './messaging/messaging.module';
import { FinancingModule } from './financing/financing.module';
import { FreightModule } from './freight/freight.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AdminModule } from './admin/admin.module';
import { FaqModule } from './faq/faq.module';
import { PromotionsModule } from './promotions/promotions.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProductsModule,
    CategoriesModule,
    RfqModule,
    OrdersModule,
    SettingsModule,
    PaymentsModule,
    MessagingModule,
    FinancingModule,
    FreightModule,
    MaintenanceModule,
    AdminModule,
    FaqModule,
    PromotionsModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
