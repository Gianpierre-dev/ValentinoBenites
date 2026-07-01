import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MetodoPago } from '@prisma/client';

export class ItemPedidoDto {
  // La unidad comprable es la Variante (color), no el Producto (modelo).
  @IsString()
  @IsNotEmpty({ message: 'La variante es obligatoria.' })
  varianteId!: string;

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

  // El comprobante debe ser una URL https de nuestro propio storage
  // (lo devuelve POST /storage/upload), no una URL arbitraria del cliente.
  @IsOptional()
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'El comprobante debe ser una URL https válida.' },
  )
  @MaxLength(2048)
  comprobanteUrl?: string;
}
