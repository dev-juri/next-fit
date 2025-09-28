import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestMetadata {
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  ip: string | undefined;
  userAgent: string;
  timestamp: string;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {

    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Add request ID to request object for tracking
    req['requestId'] = requestId;

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;

      const completedMetadata: RequestMetadata = {
        requestId,
        method,
        url: originalUrl,
        statusCode,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
      };

      const message = `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`;

      if (statusCode >= 500) {
        this.logWithMetadata('error', message, completedMetadata);
      } else if (statusCode >= 400) {
        this.logWithMetadata('warn', message, completedMetadata);
      } else {
        this.logWithMetadata('log', message, completedMetadata);
      }
    });

    next();
  }


  private logWithMetadata(
    level: 'log' | 'error' | 'warn' | 'debug',
    message: string,
    metadata: RequestMetadata,
  ): void {
    const formattedMessage = `${message} | ${JSON.stringify(metadata)}`;

    switch (level) {
      case 'error':
        this.logger.error(formattedMessage);
        break;
      case 'warn':
        this.logger.warn(formattedMessage);
        break;
      case 'debug':
        this.logger.debug(formattedMessage);
        break;
      default:
        this.logger.log(formattedMessage);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}