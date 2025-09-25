import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appCreate } from './app.create';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = appCreate(app)
  
  await app.listen(port ?? '0.0.0.0');
}
bootstrap();
