import { Inject, Injectable } from '@nestjs/common';
import { DbService } from '../../db/db.module';
import { MailService } from './mail.service';
import { fail } from '../../common/http';
import { createAccessToken } from '../../common/jwt';
import {
  checkPassword,
  hashPassword,
  hashToken,
  isUniversityEmail,
  maskStudentCode,
  newToken,
  normalizeEmail,
} from '../../common/security';
import { readConfig } from '../../config';
import { loginSchema, registerSchema, z } from '@campusfind/contracts';
import type { User } from '@campusfind/database';
export const publicUser = (u: User) => ({
  id: u.id,
  displayName: u.displayName,
  studentCodeMasked: maskStudentCode(u.studentCode),
  role: u.role,
});
@Injectable()
export class AuthService {
  constructor(
    @Inject(DbService) private readonly db: DbService,
    @Inject(MailService) private readonly mail: MailService,
  ) {}
  async register(input: z.infer<typeof registerSchema>) {
    const email = normalizeEmail(input.email);
    if (!isUniversityEmail(email, readConfig().domains))
      fail(400, 'UNIVERSITY_EMAIL_REQUIRED', 'Сургуулийн и-мэйл ашиглана уу');
    const passwordHash = await hashPassword(input.password),
      token = newToken();
    const existing = await this.db.user.findFirst({
      where: { OR: [{ email }, { studentCode: input.studentCode }] },
    });
    if (existing) {
      // Allow retries after SMTP failure without replacing an existing password.
      if (
        existing.email === email &&
        !existing.emailVerifiedAt &&
        !existing.blockedAt &&
        (await checkPassword(input.password, existing.passwordHash))
      ) {
        await this.db.verificationToken.create({
          data: {
            tokenHash: hashToken(token),
            userId: existing.id,
            expiresAt: new Date(Date.now() + 86400000),
          },
        });
        await this.deliver(email, token);
      }
      return { message: 'Шаардлага хангасан бүртгэлд баталгаажуулах и-мэйл илгээнэ' };
    }
    await this.db.user.create({
      data: {
        email,
        displayName: input.displayName,
        studentCode: input.studentCode,
        passwordHash,
        verificationTokens: {
          create: { tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86400000) },
        },
      },
    });
    await this.deliver(email, token);
    return { message: 'Шаардлага хангасан бүртгэлд баталгаажуулах и-мэйл илгээнэ' };
  }
  private async deliver(email: string, token: string) {
    try {
      await this.mail.sendVerification(email, token);
    } catch {
      fail(
        503,
        'MAIL_UNAVAILABLE',
        'И-мэйл сервер түр ажиллахгүй байна. Ижил мэдээллээр дахин оролдоно уу',
      );
    }
  }
  async verify(token: string) {
    const tokenHash = hashToken(token);
    await this.db.$transaction(async (tx) => {
      const row = await tx.verificationToken.findUnique({ where: { tokenHash } });
      if (!row || row.usedAt || row.expiresAt <= new Date())
        fail(400, 'INVALID_TOKEN', 'Холбоос буруу эсвэл хугацаа дууссан');
      const used = await tx.verificationToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (used.count !== 1) fail(400, 'INVALID_TOKEN', 'Холбоос ашиглагдсан');
      await tx.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
      await tx.verificationToken.updateMany({
        where: { userId: row.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    });
    return { message: 'И-мэйл баталгаажлаа. Нэвтэрч болно' };
  }
  async login(input: z.infer<typeof loginSchema>) {
    const user = await this.db.user.findUnique({ where: { email: normalizeEmail(input.email) } });
    if (!user) {
      await hashPassword(input.password);
      fail(401, 'INVALID_CREDENTIALS', 'И-мэйл эсвэл нууц үг буруу');
    }
    if (user.lockedUntil && user.lockedUntil > new Date())
      fail(429, 'LOGIN_LOCKED', '10 минутын дараа дахин оролдоно уу');
    if (!(await checkPassword(input.password, user.passwordHash))) {
      const reset = !!user.lockedUntil && user.lockedUntil <= new Date();
      const failed = await this.db.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: reset ? 1 : { increment: 1 },
          ...(reset ? { lockedUntil: null } : {}),
        },
      });
      if (failed.failedAttempts >= 5)
        await this.db.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + 600000) },
        });
      fail(
        failed.failedAttempts >= 5 ? 429 : 401,
        failed.failedAttempts >= 5 ? 'LOGIN_LOCKED' : 'INVALID_CREDENTIALS',
        'И-мэйл эсвэл нууц үг буруу',
      );
    }
    if (user.blockedAt || !user.emailVerifiedAt)
      fail(403, 'ACCOUNT_UNAVAILABLE', 'И-мэйл баталгаажсан, идэвхтэй бүртгэл шаардлагатай');
    const jti = newToken();
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    const token = await createAccessToken(user.id, jti, expiresAt);

    await this.db.$transaction([
      this.db.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      }),
      this.db.session.create({
        data: {
          tokenHash: hashToken(jti),
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    return { token, expiresAt, user: publicUser(user) };
  }
  async logout(tokenHash: string) {
    await this.db.session.deleteMany({ where: { tokenHash } });
    return { message: 'Системээс гарлаа' };
  }
}
