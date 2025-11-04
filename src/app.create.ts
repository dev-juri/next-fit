import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlobalHttpExceptionFilter } from './filters/global-http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function appCreate(app: INestApplication): string | undefined {

  const configService = app.get(ConfigService)

  app.useGlobalFilters(new GlobalHttpExceptionFilter())

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

  const config = new DocumentBuilder()
    .setTitle('Next-fit Documentation')
    .setDescription('Next-fit API documentation')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT Bearer token',
      in: 'header',
    }, 'access-token')
    .addServer(configService.get<string>('appConfig.backendUrl')!)
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/specs', app, documentFactory);

  const port = configService.get<string>('appConfig.port')

  return port
}