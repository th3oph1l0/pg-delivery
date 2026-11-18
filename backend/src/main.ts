import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const isProd = process.env.NODE_ENV === 'production';

  app.use(helmet());
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? '').split(','), credentials: true });
  app.use((req: { headers: Record<string, string> }, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    req.headers['x-request-id'] ??= randomUUID();
    res.setHeader('x-request-id', req.headers['x-request-id']);
    next();
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('PG Delivery API')
      .setDescription('Pequeno Gigante Delivery — contratos REST (docs/04-contratos-api.md)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`PG Delivery API em http://localhost:${port} (docs: /api/docs)`, 'Bootstrap');
}

void bootstrap();
