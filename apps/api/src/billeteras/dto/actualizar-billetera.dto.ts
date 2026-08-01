import { PartialType } from '@nestjs/mapped-types';
import { CrearBilleteraDto } from './crear-billetera.dto';

export class ActualizarBilleteraDto extends PartialType(CrearBilleteraDto) {}
