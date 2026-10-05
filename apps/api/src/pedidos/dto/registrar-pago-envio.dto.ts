import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

/**
 * Costo del envio que la admin vio al confirmar el cobro. Si el envio cambio
 * desde otra pestaña, el servidor rechaza el registro en lugar de sumar un
 * monto distinto al confirmado.
 */
export class RegistrarPagoEnvioDto {
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El costo de envío no es válido.' },
  )
  @Min(0, { message: 'El costo de envío no puede ser negativo.' })
  costoEnvioEsperado!: number;
}
