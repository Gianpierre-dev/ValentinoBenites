import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { EsUrlDeStorage } from '../../common/url-storage';

/**
 * Letras (con tildes y ñ), espacios y signos de nombres compuestos. Se valida
 * tambien aqui —no solo en el formulario— porque el cliente es manipulable.
 */
const SOLO_NOMBRE = /^[\p{L}][\p{L}\s'.-]*$/u;

/** Celular peruano: 9 digitos que empiezan en 9. */
const CELULAR_PERUANO = /^9\d{8}$/;

/** Tope de cantidad por linea. Sin el, una cantidad enorme desborda el Decimal(10,2). */
export const CANTIDAD_MAXIMA_POR_LINEA = 999;

/**
 * Tope de lineas por pedido. Junto con CANTIDAD_MAXIMA_POR_LINEA acota el total
 * por debajo del maximo de la columna Decimal(10,2) y evita pedidos gigantes.
 */
export const LINEAS_MAXIMAS_POR_PEDIDO = 50;

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
  @Max(CANTIDAD_MAXIMA_POR_LINEA, {
    message: `La cantidad por producto no puede superar ${CANTIDAD_MAXIMA_POR_LINEA}.`,
  })
  cantidad!: number;
}

/** Items del carrito a cotizar o comprar. */
export class ItemsPedidoDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto.' })
  @ArrayMaxSize(LINEAS_MAXIMAS_POR_PEDIDO, {
    message: `El pedido no puede tener más de ${LINEAS_MAXIMAS_POR_PEDIDO} productos distintos.`,
  })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items!: ItemPedidoDto[];
}

/**
 * Cotizacion previa al pago: el checkout manda el carrito y recibe los precios
 * vigentes y que lineas siguen disponibles, ANTES de mostrar el QR.
 */
export class CotizarPedidoDto extends ItemsPedidoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  billeteraId?: string;
}

export class CrearPedidoDto extends ItemsPedidoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio.' })
  @MinLength(3, { message: 'Ingresa el nombre completo.' })
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  @Matches(SOLO_NOMBRE, { message: 'El nombre solo puede tener letras.' })
  nombreCliente!: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(CELULAR_PERUANO, {
    message: 'Ingresa un celular válido de 9 dígitos que empiece en 9.',
  })
  telefono!: string;

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

  // Obligatorio al pagar con billetera (el pedido se valida contra el pago) y
  // debe apuntar a NUESTRO proxy de storage, nunca a un dominio ajeno.
  @ValidateIf(
    (dto: CrearPedidoDto) =>
      Boolean(dto.billeteraId) || dto.comprobanteUrl !== undefined,
  )
  @IsString({ message: 'Sube el comprobante de pago para continuar.' })
  @IsNotEmpty({ message: 'Sube el comprobante de pago para continuar.' })
  @MaxLength(2048)
  @EsUrlDeStorage({ message: 'El comprobante debe subirse desde la tienda.' })
  comprobanteUrl?: string;

  // Consentimiento de tratamiento de datos (Ley 29733): el servidor lo exige y
  // registra el momento, no solo el formulario.
  @Equals(true, {
    message:
      'Debes aceptar la Política de Privacidad y los Términos y Condiciones.',
  })
  aceptaTerminos!: boolean;

  // Una clave por intento de compra: si el mismo intento llega dos veces, se
  // devuelve el pedido ya creado.
  @IsOptional()
  @IsUUID('4', { message: 'La clave del pedido no es válida.' })
  claveIdempotencia?: string;
}
