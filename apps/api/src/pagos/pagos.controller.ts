import { Body, Controller, Post } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { GenerarTokenDto } from './dto/generar-token.dto';
import { CallbackIzipayDto } from './dto/callback-izipay.dto';

@Controller('pagos/izipay')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // Genera el token de pago (STUB). Publico: lo consume el checkout del cliente.
  @Post('token')
  generarToken(@Body() dto: GenerarTokenDto) {
    return this.pagosService.generarToken(dto);
  }

  // Callback/IPN del proveedor. Marca el pedido como PAGADO.
  // ENGANCHE INTEGRACIÓN REAL: para validar la firma KR-Hash/HMAC de Izipay se
  // necesita el BODY CRUDO (rawBody) tal cual llego, no el DTO ya parseado.
  // Habilitar `rawBody: true` en el bootstrap de Nest y verificar la firma sobre
  // ese buffer ANTES de delegar al servicio. Hoy el servicio queda protegido por
  // el flag fail-closed IZIPAY_STUB_HABILITADO.
  @Post('callback')
  procesarCallback(@Body() dto: CallbackIzipayDto) {
    return this.pagosService.procesarCallback(dto);
  }
}
