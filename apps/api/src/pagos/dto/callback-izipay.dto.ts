import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Payload del callback (IPN) de Izipay. En este STUB no se valida la firma
 * (KR-Hash/HMAC); en la integracion real se debe verificar ANTES de mutar el
 * pedido (ver PagosService.procesarCallback y §9 del design).
 */
export class CallbackIzipayDto {
  @IsString()
  @IsNotEmpty({ message: 'El pedido es obligatorio.' })
  pedidoId!: string;

  @IsString()
  @IsNotEmpty({ message: 'La referencia de transaccion es obligatoria.' })
  referenciaTransaccion!: string;

  // Datos crudos adicionales del proveedor (se guardan en rawPago para auditoria).
  @IsOptional()
  @IsObject()
  datos?: Record<string, unknown>;
}
