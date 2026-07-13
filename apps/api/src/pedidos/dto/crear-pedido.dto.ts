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
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MetodoPago } from '@prisma/client';

/**
 * Un item del pedido es O BIEN una variante (color) elegida, O BIEN un producto
 * "a coordinar" (modelo multi-color agregado sin color; se define luego por
 * WhatsApp). Debe venir al menos uno de los dos identificadores:
 * - `varianteId` presente  -> color elegido (precio efectivo de la variante).
 * - sin `varianteId` + `productoId` -> a coordinar (precio base del producto).
 */
export class ItemPedidoDto {
  // Se valida solo si no vino productoId (asi neither -> ambos fallan).
  @ValidateIf((item: ItemPedidoDto) => !item.productoId)
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar la variante o el producto.' })
  varianteId?: string;

  // Alternativa a coordinar: requerido solo cuando no hay varianteId.
  @ValidateIf((item: ItemPedidoDto) => !item.varianteId)
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar la variante o el producto.' })
  productoId?: string;

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
