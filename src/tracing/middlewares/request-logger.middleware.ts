import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { asyncLocalStorage, RequestStore } from '../async-local-storage';

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
    
    // 1. Get or generate the request ID
    const requestId = req.header('X-Request-ID') || crypto.randomUUID();

    // 2. Set the response header
    res.setHeader('X-Request-ID', requestId);

    const store: RequestStore = { requestId };

    asyncLocalStorage.run(store, () => {
        
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
          const formattedMessage = `${message} | ${JSON.stringify(completedMetadata)}`;
          
          if (statusCode >= 500) {
            this.logger.error(formattedMessage);
          } else if (statusCode >= 400) {
            this.logger.warn(formattedMessage);
          } else {
            this.logger.log(formattedMessage);
          }
        });

        next();
    });
  }
}