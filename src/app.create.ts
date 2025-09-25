import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function appCreate(app: INestApplication): string | undefined {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // enable CORS
  app.enableCors();

  const configService = app.get(ConfigService)
  const port = configService.get<string>('appConfig.PORT')

  return port
}