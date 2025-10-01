import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import envValidation from './config/env.validation';
import appConfig from './config/app.config';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { AdminModule } from './admin/admin.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    AdminModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
      validationOptions: envValidation
    }),
    EventEmitterModule.forRoot({
      delimiter: '.'
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware)
      .forRoutes('*')
  }

}
