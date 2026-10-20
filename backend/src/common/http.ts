import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@campusfind/database';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from '@campusfind/contracts';
export function parse<T>(schema: z.ZodType<T, any, any>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new HttpException(
      {
        code: 'VALIDATION_ERROR',
        message: 'Оруулсан өгөгдөл буруу',
        details: result.error.issues.map((x) => ({ path: x.path, message: x.message })),
      },
      400,
    );
  return result.data;
}
export function fail(status: number, code: string, message: string): never {
  throw new HttpException({ code, message }, status);
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<Request>();
    const res = host.switchToHttp().getResponse<Response>();
    const requestId = String(res.getHeader('X-Request-Id') ?? randomUUID());
    let status = 500,
      code = 'INTERNAL_ERROR',
      message = 'Серверийн алдаа',
      details: unknown;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body) {
        const b = body as Record<string, unknown>;
        code = String(b.code ?? HttpStatus[status] ?? 'ERROR');
        message = String(b.message ?? 'Хүсэлт амжилтгүй');
        details = b.details;
      } else {
        code = String(HttpStatus[status]);
        message = String(body);
      }
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === 'P2002'
    ) {
      status = 409;
      code = 'CONFLICT';
      message = 'Ижил утгатай бүртгэл байна';
    }
    if (status === 500)
      console.error(
        JSON.stringify({
          requestId,
          method: req.method,
          path: req.path,
          error: exception instanceof Error ? exception.name : 'UnknownError',
        }),
      );
    res
      .status(status)
      .json({ error: { code, message, requestId, ...(details ? { details } : {}) } });
  }
}
