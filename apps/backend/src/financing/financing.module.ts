import { Module } from '@nestjs/common';
import { FinancingController } from './financing.controller';
import { FinancingService } from './financing.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FinancingController],
  providers: [FinancingService],
  exports: [FinancingService],
})
export class FinancingModule {}
