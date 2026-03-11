import { Module } from '@nestjs/common';
import { FreightController } from './freight.controller';
import { FreightService } from './freight.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FreightController],
  providers: [FreightService],
  exports: [FreightService],
})
export class FreightModule {}
