import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Datos de envio que la admin completa tras coordinar por WhatsApp: costo y
 * direccion exacta. El total del pedido se recalcula como subtotal + costoEnvio.
 * Sin costo el envio sigue por coordinar; un 0 explicito es envio gratuito. Con
 * pago en destino la tienda no cobra el envio: el costo queda en 0.
 */
export class ActualizarEnvioDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El costo de envío no es válido.' },
  )
  @Min(0, { message: 'El costo de envío no puede ser negativo.' })
  // Tope holgado que mantiene subtotal + envio dentro de Decimal(10,2).
  @Max(9999, { message: 'El costo de envío es demasiado alto.' })
  costoEnvio?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'La dirección es demasiado larga.' })
  direccionEntrega?: string;

  // El cliente le paga el envio a la agencia al recibir: la tienda no lo cobra.
  @IsOptional()
  @IsBoolean()
  pagoEnDestino?: boolean;
}
