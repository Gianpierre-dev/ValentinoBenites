import { Module } from '@nestjs/common';
import { VariantesController } from './variantes.controller';
import { VariantesService } from './variantes.service';

@Module({
  controllers: [VariantesController],
  providers: [VariantesService],
})
export class VariantesModule {}
