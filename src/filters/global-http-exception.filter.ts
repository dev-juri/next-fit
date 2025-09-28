import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

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

  /**
   * Method that handles caught exceptions and sends a formatted error response.
   *
   * @param exception - The thrown exception object.
   * @param host - The current execution context.
   */
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

    return response.status(status).json({ success: false, message: message });
  }
}