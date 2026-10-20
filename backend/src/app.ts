import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { REPOSITORY_ROOT } from './environment';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/http';
import { readConfig } from './config';
export function configureApp(app: INestApplication) {
  const config = readConfig();
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.origin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CampusFind'],
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      (req.get('X-CampusFind') !== 'web' ||
        (req.get('Origin') && req.get('Origin') !== config.origin))
    ) {
      res.status(403).json({
        error: { code: 'CSRF_REJECTED', message: 'Хүсэлтийн эх сурвалж буруу', requestId },
      });
      return;
    }
    next();
  });
  // In-memory IP throttle for a single API process. Replace with shared storage before scaling.
  const hits = new Map<string, { count: number; reset: number }>();
  app.use('/api/v1/auth', (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST') {
      next();
      return;
    }
    const now = Date.now();
    for (const [key, value] of hits) if (value.reset <= now) hits.delete(key);
    const key = req.ip ?? 'unknown',
      bucket = hits.get(key) ?? { count: 0, reset: now + 600000 };
    bucket.count++;
    hits.set(key, bucket);
    if (bucket.count > 30) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Хэт олон хүсэлт',
          requestId: String(res.getHeader('X-Request-Id')),
        },
      });
      return;
    }
    next();
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  if (!config.production) {
    const spec = JSON.parse(
      readFileSync(resolve(REPOSITORY_ROOT, 'docs/api/openapi.json'), 'utf8'),
    );
    app.use('/openapi.json', (_req: Request, res: Response) => res.json(spec));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }
}
export async function createApp() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  configureApp(app);
  return app;
}
