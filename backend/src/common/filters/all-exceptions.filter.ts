import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';

/**
 * Global Exception Filter
 * Catches all unhandled exceptions and logs them with Winston logger
 * Provides detailed errors in development, sanitized errors in production
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction =
      this.configService.getOrThrow<string>('NODE_ENV') === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorDetails: Record<string, any> = {};

    // Handle HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorDetails = {
          ...responseObj,
          // Include service context if available
          service: responseObj.service,
          method: responseObj.method,
        };
      } else {
        message = exceptionResponse as string;
      }

      // Log with appropriate level based on status code
      if (status >= 500) {
        this.logger.error(
          `[${request.method}] ${request.url} - Status: ${status} - ${message}`,
          exception.stack,
          'ExceptionFilter',
        );
      } else {
        this.logger.warn(
          `[${request.method}] ${request.url} - Status: ${status} - ${message}`,
          'ExceptionFilter',
        );
      }

      // Always log full details in development
      if (!isProduction) {
        this.logger.debug(
          `Exception Stack: ${exception.stack || 'No stack available'}`,
          'ExceptionFilter',
        );
      }
    } else if (exception instanceof Error) {
      // Handle regular JavaScript errors
      message = exception.message;
      const stack = exception.stack;

      this.logger.error(
        `[${request.method}] ${request.url} - Unhandled Exception: ${message}`,
        stack,
        'ExceptionFilter',
      );

      errorDetails = {
        name: exception.name,
        message: exception.message,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        // Extract service info from custom error properties if available
        service: (exception as any).service,
        methodName: (exception as any).method,
      };
    } else {
      // Handle unknown errors
      const errorString = JSON.stringify(exception);

      this.logger.error(
        `[${request.method}] ${request.url} - Unknown Exception: ${errorString}`,
        undefined,
        'ExceptionFilter',
      );

      errorDetails = {
        unknown: exception,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      };
    }

    // Sanitize error response for production
    const clientResponse = this.buildClientResponse(
      status,
      message,
      errorDetails,
      request.url,
      isProduction,
    );

    // Send response to client
    response.status(status).json(clientResponse);
  }

  /**
   * Build appropriate error response based on environment
   */
  private buildClientResponse(
    status: number,
    message: string,
    errorDetails: Record<string, any>,
    path: string,
    isProduction: boolean,
  ) {
    // Base response
    const baseResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path,
    };

    // Production: Hide sensitive details for server errors (5xx)
    if (isProduction) {
      if (status >= 500) {
        return {
          ...baseResponse,
          message: 'An error occurred while processing your request',
          error: HttpStatus[status] || 'Internal Server Error',
        };
      }

      // For client errors (4xx), show message but filter out sensitive details
      return {
        ...baseResponse,
        message: this.sanitizeMessage(message, errorDetails),
        error: HttpStatus[status],
        // Include validation errors if present
        ...(errorDetails.message &&
          Array.isArray(errorDetails.message) && {
            errors: errorDetails.message,
          }),
      };
    }

    // Development: Show full error details
    return {
      ...baseResponse,
      message,
      error: HttpStatus[status] || 'Internal Server Error',
      details: {
        ...errorDetails,
        // Remove undefined/null values
        ...Object.fromEntries(
          Object.entries(errorDetails).filter(([_, v]) => v != null),
        ),
      },
    };
  }

  /**
   * Sanitize error messages for production
   */
  private sanitizeMessage(
    message: string | string[],
    errorDetails: Record<string, any>,
  ): string | string[] {
    // If it's validation errors, keep them (they're user-facing)
    if (Array.isArray(message)) {
      return message;
    }

    // If it's a validation pipe error with nested messages
    if (
      Array.isArray(errorDetails.message) &&
      typeof message === 'string' &&
      message.toLowerCase().includes('validation')
    ) {
      return message; // Keep validation error messages
    }

    // For other errors, return generic or the original message
    // (since 4xx errors are usually safe to show)
    return message;
  }
}
