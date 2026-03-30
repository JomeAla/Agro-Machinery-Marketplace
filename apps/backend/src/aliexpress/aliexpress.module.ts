import { Module } from '@nestjs/common';
import { AliExpressController } from './aliexpress.controller';
import { AliExpressService } from './aliexpress.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AliExpressController],
  providers: [AliExpressService],
  exports: [AliExpressService],
})
export class AliexpressModule {}
