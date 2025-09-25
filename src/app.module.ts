import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import envValidation from './config/env.validation';
import appConfig from './config/app.config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
    load: [appConfig],
    validationOptions: envValidation
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
