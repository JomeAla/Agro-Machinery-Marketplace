import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
