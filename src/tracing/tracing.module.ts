import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
    providers: [RequestContextService],
    exports: [RequestContextService],
})
export class TracingModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    }
}
