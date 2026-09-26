import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DecimalInterceptor } from './common/decimal.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Railway entrega las peticiones a través de su proxy (un salto): sin esto,
  // req.ip es la IP del proxy y los límites por IP se comparten entre todos
  // los clientes.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new DecimalInterceptor());

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000',
    credentials: true,
  });

  const puerto = config.get<number>('PORT') ?? 3001;
  await app.listen(puerto);
}

void bootstrap();
