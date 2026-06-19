import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que protege rutas administrativas exigiendo un JWT valido.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
