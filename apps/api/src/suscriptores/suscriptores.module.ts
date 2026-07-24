import { Module } from '@nestjs/common';
import { SuscriptoresController } from './suscriptores.controller';
import { SuscriptoresService } from './suscriptores.service';

@Module({
  controllers: [SuscriptoresController],
  providers: [SuscriptoresService],
})
export class SuscriptoresModule {}
