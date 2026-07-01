import { IsNotEmpty, IsString } from 'class-validator';

export class GenerarTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'El pedido es obligatorio.' })
  pedidoId!: string;
}
