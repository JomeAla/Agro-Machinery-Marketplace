import { Module } from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { ComparisonController } from './comparison.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ComparisonService],
  controllers: [ComparisonController],
  exports: [ComparisonService],
})
export class ComparisonModule {}
