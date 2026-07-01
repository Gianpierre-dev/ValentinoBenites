import { Module } from '@nestjs/common';
import { MigracionController } from './migracion.controller';
import { MigracionService } from './migracion.service';

@Module({
  controllers: [MigracionController],
  providers: [MigracionService],
})
export class MigracionModule {}
