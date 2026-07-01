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
  // En la integracion real se valida la firma del IPN dentro del servicio.
  @Post('callback')
  procesarCallback(@Body() dto: CallbackIzipayDto) {
    return this.pagosService.procesarCallback(dto);
  }
}
