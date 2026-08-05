import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/**
 * Letras (con tildes y ñ), espacios y signos de nombres compuestos. Se valida
 * tambien aqui —no solo en el formulario— porque el cliente es manipulable.
 */
const SOLO_NOMBRE = /^[\p{L}][\p{L}\s'.-]*$/u;

/** Celular peruano: 9 digitos que empiezan en 9. */
const CELULAR_PERUANO = /^9\d{8}$/;

/**
 * El comprobante debe ser una URL de nuestro proxy de storage
 * (`<API_PUBLIC_URL>/api/storage/archivo/<uuid>.<ext>`). Se ancla al path del
 * proxy —no al host, que varia por entorno— para rechazar dominios ajenos sin
 * acoplar el DTO a la URL exacta de produccion.
 */
const RUTA_COMPROBANTE =
  /^https:\/\/[^/]+\/api\/storage\/archivo\/[A-Za-z0-9._-]+$/;

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

  // Tope superior: sin el, una cantidad enorme desborda el subtotal Decimal(10,2)
  // en Postgres y el INSERT revienta con un 500 opaco. 999 es holgado para una
  // tienda hecha a pedido y mantiene el total dentro del rango de la columna.
  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  @Max(999, { message: 'La cantidad por producto no puede superar 999.' })
  cantidad!: number;
}

export class CrearPedidoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio.' })
  @MinLength(3, { message: 'Ingresa el nombre completo.' })
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  @Matches(SOLO_NOMBRE, { message: 'El nombre solo puede tener letras.' })
  nombreCliente!: string;

  @IsString()
  @IsNotEmpty({ message: 'El telefono es obligatorio.' })
  @Matches(CELULAR_PERUANO, {
    message: 'Ingresa un celular valido de 9 digitos que empiece en 9.',
  })
  telefono!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto.' })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items!: ItemPedidoDto[];

  /**
   * Billetera elegida para pagar (Yape, Plin, Agora...). Si se omite, el pedido
   * se coordina por WhatsApp. El backend valida que exista y este activa, y
   * guarda su NOMBRE como snapshot en el pedido.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  billeteraId?: string;

  // Ciudad/departamento de entrega (opcional): el cliente lo indica para
  // agilizar la cotizacion del envio. La direccion exacta se coordina luego.
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'La ciudad es demasiado larga.' })
  ciudadEntrega?: string;

  // El comprobante debe apuntar a NUESTRO proxy de storage (lo devuelve
  // POST /storage/upload), no a una URL arbitraria del cliente: una URL externa
  // permitiria mostrarle a la admin un comprobante alojado en un dominio ajeno.
  @IsOptional()
  @Matches(RUTA_COMPROBANTE, {
    message: 'El comprobante debe subirse desde la tienda.',
  })
  @MaxLength(2048)
  comprobanteUrl?: string;
}
