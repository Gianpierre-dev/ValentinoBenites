import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { serializarDecimal } from './serializar-decimal';

/**
 * Interceptor global que serializa los Decimal de Prisma a number
 * en todas las respuestas salientes.
 */
@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(_contexto: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((datos) => serializarDecimal(datos)));
  }
}
