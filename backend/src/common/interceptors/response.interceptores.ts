import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);
  private readonly isProd: boolean;
  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.getOrThrow<string>('NODE_ENV');
    this.isProd = nodeEnv === 'production';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        if (this.isProd) {
          // Production logging
          this.logger.log(
            `${request.method} ${request.url} - Status: ${statusCode} - ${responseTime}ms`,
          );
        } else {
          // Development logging (more detailed)
          console.log({
            method: request.method,
            url: request.url,
            statusCode: statusCode,
            responseTime: `${responseTime}ms`,
            //data: data,
          });
        }

        return {
          data,
          server_meta: {
            success: true,
            statusCode: statusCode,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
