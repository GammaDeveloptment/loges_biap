import { Module } from '@nestjs/common';
import { FuentesController } from './fuentes.controller';
import { FuentesService } from './fuentes.service';

@Module({
  controllers: [FuentesController],
  providers: [FuentesService],
})
export class FuentesModule {}
