import 'reflect-metadata';
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { HttpException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import type { DbService } from '../../src/db/db.module';
import type { MailService } from '../../src/modules/auth/mail.service';
import { hashPassword, hashToken } from '../../src/common/security';

// Lab 11 — AuthService.login-ийн unit тест. PostgreSQL-ийн оронд DbService-ийг mock хийнэ.

const PASSWORD = 'correct-horse-battery';
const LOCK_MS = 10 * 60 * 1000;

type UserRow = {
  id: string;
  displayName: string;
  email: string;
  studentCode: string;
  role: 'MEMBER';
  emailVerifiedAt: Date | null;
  blockedAt: Date | null;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
};
type UpdateArgs = { where: { id: string }; data: Record<string, unknown> };

let passwordHash: string;
async function makeUser(overrides: Partial<UserRow> = {}): Promise<UserRow> {
  passwordHash ??= await hashPassword(PASSWORD);
  return {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Тест хэрэглэгч',
    email: 'student@example.edu',
    studentCode: 'B232270021',
    role: 'MEMBER',
    emailVerifiedAt: new Date('2026-09-01T00:00:00Z'),
    blockedAt: null,
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

// Prisma-гийн increment-ийг дуурайж, update хийсний дараах мөрийг буцаадаг mock DB.
function mockDb(t: TestContext, user: UserRow | null) {
  const row = user ? { ...user } : null;
  const findUnique = t.mock.fn(async (args: { where: { email: string } }) =>
    row && row.email === args.where.email ? row : null,
  );
  const update = t.mock.fn(async ({ data }: UpdateArgs) => {
    assert.ok(row, 'update must not run for an unknown user');
    const counter = data.failedAttempts;
    if (typeof counter === 'number') row.failedAttempts = counter;
    else if (counter && typeof counter === 'object' && 'increment' in counter)
      row.failedAttempts += Number(counter.increment);
    if ('lockedUntil' in data) row.lockedUntil = data.lockedUntil as Date | null;
    return { ...row };
  });
  const sessionCreate = t.mock.fn(async (args: { data: { tokenHash: string } }) => args.data);
  const transaction = t.mock.fn(async (ops: Promise<unknown>[]) => Promise.all(ops));
  const db = {
    user: { findUnique, update },
    session: { create: sessionCreate },
    $transaction: transaction,
  };
  const mail = { sendVerification: t.mock.fn(async () => {}) };
  const service = new AuthService(db as unknown as DbService, mail as unknown as MailService);
  return { service, findUnique, update, sessionCreate, transaction };
}

function httpError(status: number, code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof HttpException);
    assert.equal(error.getStatus(), status);
    assert.equal((error.getResponse() as { code: string }).code, code);
    return true;
  };
}

test('1. Зөв нууц үг: session үүсгэж, тоолуурыг тэглэж, нийтийн мэдээлэл буцаана', async (t) => {
  // Arrange
  const { service, update, sessionCreate, transaction } = mockDb(
    t,
    await makeUser({ failedAttempts: 3 }),
  );

  // Act
  const result = await service.login({ email: 'student@example.edu', password: PASSWORD });

  // Assert
  assert.match(result.token, /^[a-f0-9]{64}$/);
  assert.ok(result.expiresAt.getTime() > Date.now() + 6 * 86400000);
  assert.deepEqual(result.user, {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Тест хэрэглэгч',
    studentCodeMasked: 'B23****',
    role: 'MEMBER',
  });
  assert.equal(transaction.mock.callCount(), 1);
  assert.deepEqual(update.mock.calls[0].arguments[0].data, {
    failedAttempts: 0,
    lockedUntil: null,
  });
  assert.equal(sessionCreate.mock.calls[0].arguments[0].data.tokenHash, hashToken(result.token));
});

test('2. Буруу нууц үг (1 дэх): 401 INVALID_CREDENTIALS, тоолуур 1-ээр нэмэгдэнэ', async (t) => {
  // Arrange
  const { service, update, sessionCreate } = mockDb(t, await makeUser());

  // Act
  const attempt = service.login({ email: 'student@example.edu', password: 'wrong-password-1' });

  // Assert
  await assert.rejects(attempt, httpError(401, 'INVALID_CREDENTIALS'));
  assert.equal(update.mock.callCount(), 1);
  assert.deepEqual(update.mock.calls[0].arguments[0].data, { failedAttempts: { increment: 1 } });
  assert.equal(sessionCreate.mock.callCount(), 0);
});

test('3. Хил: 5 дахь буруу оролдлого 429 LOGIN_LOCKED, 10 минут түгжинэ', async (t) => {
  // Arrange
  const { service, update } = mockDb(t, await makeUser({ failedAttempts: 4 }));
  const before = Date.now();

  // Act
  const attempt = service.login({ email: 'student@example.edu', password: 'wrong-password-5' });

  // Assert
  await assert.rejects(attempt, httpError(429, 'LOGIN_LOCKED'));
  assert.equal(update.mock.callCount(), 2);
  const lockedUntil = update.mock.calls[1].arguments[0].data.lockedUntil as Date;
  assert.ok(lockedUntil.getTime() >= before + LOCK_MS);
  assert.ok(lockedUntil.getTime() <= Date.now() + LOCK_MS);
});

test('4. Хил: бүртгэлгүй и-мэйл буруу нууц үгтэй ижил 401 өгч, account байгаа эсэхийг задлахгүй', async (t) => {
  // Arrange
  const unknown = mockDb(t, null);
  const known = mockDb(t, await makeUser());

  // Act
  const unknownError = await unknown.service
    .login({ email: 'nobody@example.edu', password: 'wrong-password-1' })
    .catch((error: unknown) => error);
  const knownError = await known.service
    .login({ email: 'student@example.edu', password: 'wrong-password-1' })
    .catch((error: unknown) => error);

  // Assert
  assert.ok(unknownError instanceof HttpException && knownError instanceof HttpException);
  assert.equal(unknownError.getStatus(), knownError.getStatus());
  assert.deepEqual(unknownError.getResponse(), knownError.getResponse());
  assert.equal(unknown.update.mock.callCount(), 0);
});

test('5. Mock: түгжигдсэн хэрэглэгч зөв нууц үгтэй ч 429; DB-д бичихгүй, session үүсгэхгүй', async (t) => {
  // Arrange
  const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
  const { service, update, sessionCreate, transaction } = mockDb(
    t,
    await makeUser({ failedAttempts: 5, lockedUntil }),
  );

  // Act
  const attempt = service.login({ email: 'student@example.edu', password: PASSWORD });

  // Assert
  await assert.rejects(attempt, httpError(429, 'LOGIN_LOCKED'));
  assert.equal(update.mock.callCount(), 0);
  assert.equal(sessionCreate.mock.callCount(), 0);
  assert.equal(transaction.mock.callCount(), 0);
});

test('6. Хил: түгжээ дууссаны дараах буруу оролдлого тоолуурыг 1-ээс эхлүүлнэ', async (t) => {
  // Arrange
  const { service, update } = mockDb(
    t,
    await makeUser({ failedAttempts: 5, lockedUntil: new Date(Date.now() - 1000) }),
  );

  // Act
  const attempt = service.login({ email: 'student@example.edu', password: 'wrong-password-1' });

  // Assert
  await assert.rejects(attempt, httpError(401, 'INVALID_CREDENTIALS'));
  assert.equal(update.mock.callCount(), 1);
  assert.deepEqual(update.mock.calls[0].arguments[0].data, {
    failedAttempts: 1,
    lockedUntil: null,
  });
});

test('7. Mock: и-мэйлийг normalize хийж хайна; баталгаажаагүй бүртгэл 403', async (t) => {
  // Arrange
  const { service, findUnique, sessionCreate } = mockDb(
    t,
    await makeUser({ emailVerifiedAt: null }),
  );

  // Act
  const attempt = service.login({ email: '  Student@EXAMPLE.edu ', password: PASSWORD });

  // Assert
  await assert.rejects(attempt, httpError(403, 'ACCOUNT_UNAVAILABLE'));
  assert.deepEqual(findUnique.mock.calls[0].arguments[0], {
    where: { email: 'student@example.edu' },
  });
  assert.equal(sessionCreate.mock.callCount(), 0);
});
