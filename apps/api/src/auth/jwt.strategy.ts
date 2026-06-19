import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface PayloadJwt {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secreto = config.get<string>('JWT_SECRET');
    if (!secreto) {
      throw new UnauthorizedException('Falta configurar JWT_SECRET.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secreto,
    });
  }

  validate(payload: PayloadJwt): PayloadJwt {
    return { sub: payload.sub, email: payload.email };
  }
}
