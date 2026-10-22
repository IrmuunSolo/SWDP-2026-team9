import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DbService } from '../db/db.module';
import { hashToken } from './security';
import { fail } from './http';
import type { Request } from 'express';
import type { User } from '@campusfind/database';
import { verifyAccessToken } from './jwt';
export const Public = () => SetMetadata('public', true);
export type AuthRequest = Request & { user: User; sessionHash: string };
export const SESSION_COOKIE = 'campusfind_session';
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(DbService) private readonly db: DbService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>('public', [ctx.getHandler(), ctx.getClass()]))
      return true;
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.[SESSION_COOKIE];

    if (typeof token !== 'string') {
      fail(401, 'UNAUTHENTICATED', 'Нэвтэрнэ үү');
    }

    let payload;

    try {
      payload = await verifyAccessToken(token);
    } catch {
      fail(401, 'UNAUTHENTICATED', 'Token буруу эсвэл хугацаа дууссан');
    }

    if (typeof payload.jti !== 'string') {
      fail(401, 'UNAUTHENTICATED', 'Token буруу');
    }

    const session = await this.db.session.findUnique({
      where: { tokenHash: hashToken(payload.jti) },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date() || session.userId !== payload.sub) {
      fail(401, 'UNAUTHENTICATED', 'Session хүчингүй эсвэл дууссан');
    }

    if (session.user.blockedAt || !session.user.emailVerifiedAt) {
      fail(403, 'ACCOUNT_UNAVAILABLE', 'Бүртгэлийн эрх хязгаарлагдсан');
    }

    req.user = session.user;
    req.sessionHash = session.tokenHash;

    return true;
  }
}
