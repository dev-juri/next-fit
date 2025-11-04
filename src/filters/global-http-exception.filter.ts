import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestContextService } from '../tracing/request-context.service';

/**
 * Global HTTP exception filter to handle all uncaught exceptions.
 *
 * This filter catches all exceptions thrown during request handling and
 * formats the response into a consistent JSON structure. It extracts the
 * HTTP status code and message from either standard `HttpException` or
 * other unknown exceptions, providing a default 500 status for unhandled errors.
 *
 * Example output:
 * ```json
 * {
 *   "success": false,
 *   "message": "Invalid input provided"
 * }
 * ```
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  constructor(
    private readonly requestContext: RequestContextService,
  ) { }

  /**
   * Method that handles caught exceptions and sends a formatted error response.
   *
   * @param exception - The thrown exception object.
   * @param host - The current execution context.
   */
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const requestId = this.requestContext.getRequestId() || 'N/A';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: exception.message || 'Internal server error' };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : Array.isArray(exceptionResponse?.message)
          ? exceptionResponse.message[0]
          : exceptionResponse?.message || 'An error occurred';

    const logDetails = {
      requestId,
      status,
      message,
      stack: status >= 500 ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(`[${requestId}] Unhandled 5xx Error: ${message} | ${JSON.stringify(logDetails)}`);
    } else {
      this.logger.warn(`[${requestId}] Client Error (${status}): ${message} | ${JSON.stringify(logDetails)}`);
    }

    return response.status(status).json({ status: 'error', message: message });
  }
}