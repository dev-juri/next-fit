import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import envValidation from './config/env.validation';
import appConfig from './config/app.config';
import { AdminModule } from './admin/admin.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JobsModule } from './jobs/jobs.module';
import { MongooseModule } from '@nestjs/mongoose';
import databaseConfig from './config/database.config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './users/users.module';
import { TracingModule } from './tracing/tracing.module';
import { GlobalHttpExceptionFilter } from './filters/global-http-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    AdminModule,
    JobsModule,

    CacheModule.register({
      isGlobal: true
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
      validationOptions: envValidation
    }),

    EventEmitterModule.forRoot({
      delimiter: '.'
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
    }),

    ScheduleModule.forRoot(),

    UsersModule,

    TracingModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
  ],
})
export class AppModule { }
