import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MetodoPago } from '@prisma/client';

export class ItemPedidoDto {
  @IsString()
  @IsNotEmpty({ message: 'El producto es obligatorio.' })
  productoId!: string;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  cantidad!: number;
}

export class CrearPedidoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio.' })
  nombreCliente!: string;

  @IsString()
  @IsNotEmpty({ message: 'El telefono es obligatorio.' })
  telefono!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto.' })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items!: ItemPedidoDto[];

  @IsEnum(MetodoPago, { message: 'El metodo de pago no es valido.' })
  metodoPago!: MetodoPago;

  @IsOptional()
  @IsString()
  comprobanteUrl?: string;
}
