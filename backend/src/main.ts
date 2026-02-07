import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';
import { transformSwaggerResponses } from './common/utils/swagger-response-transformer';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './common/interceptors/response.interceptores';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RedisIoAdapter } from './common/adapters/redis-io-adapter';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);

  const enableDocs =
    configService.getOrThrow<string>('NODE_ENV') !== 'production';
  const appName = configService.getOrThrow<string>('APP_NAME');
  const port = configService.getOrThrow<number>('PORT');
  const appVersion = configService.getOrThrow<string>('VERSION');
  const swaggerInfo = fs.readFileSync('swagger-info.md', 'utf8');

  if (enableDocs) {
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(swaggerInfo)
      .setVersion(appVersion)
      .addSecurity('Authentication', {
        type: 'apiKey',
        in: 'cookie',
        name: 'Authentication',
        description: 'Authentication cookie for user sessions',
      })
      .addSecurity('Refresh', {
        type: 'apiKey',
        in: 'cookie',
        name: 'Refresh',
        description: 'Refresh cookie for renewing authentication tokens',
      })
      .build();

    let document = SwaggerModule.createDocument(app, config);

    // Transform responses to show interceptor wrapper
    document = transformSwaggerResponses(document);

    // Setup Swagger UI
    SwaggerModule.setup('api/docs', app, document, {
      swaggerUiEnabled: true,
    });

    // Setup Scalar API Reference
    app.use(
      '/api/scaler',
      apiReference({
        content: document,
      }),
    );
  }
  app.useGlobalInterceptors(new ResponseInterceptor(configService));

  // Setup Redis Adapter for WebSockets to enable horizontal scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  app.useGlobalFilters(new AllExceptionsFilter(configService));
  app.use(cookieParser());
  app.use(helmet());

  // Hot Module Replacement (HMR) - for development use only
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  await app.listen(port);
}
bootstrap();
