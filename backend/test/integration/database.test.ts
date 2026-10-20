import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@campusfind/database';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/auth/mail.service';
import { configureApp } from '../../src/app';
// Explicitly fails without an isolated test database; never silently skips a required check.
test('PostgreSQL: register → verify → login → posts → logout, lockout and blocked session', async () => {
  if (!process.env.TEST_DATABASE_URL?.includes('campusfind_test'))
    throw new Error('TEST_DATABASE_URL нь campusfind_test гэсэн тусдаа DB байх ёстой');
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.UNIVERSITY_EMAIL_DOMAINS = 'example.edu';
  const db = new PrismaClient(),
    tokens = new Map<string, string>();
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue({
      sendVerification: async (email: string, token: string) => {
        tokens.set(email, token);
      },
    })
    .compile();
  const app = mod.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const base = (await app.getUrl()) + '/api/v1';
  const email = `test-${Date.now()}@example.edu`,
    password = 'correct horse battery staple';
  const send = (path: string, body: unknown, cookie = '') =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CampusFind': 'web', Cookie: cookie },
      body: JSON.stringify(body),
    });
  let userId: string | undefined, postId: string | undefined;
  try {
    assert.equal(
      (
        await send('/auth/register', {
          displayName: 'Тест',
          email,
          studentCode: 'T' + String(Date.now()).slice(-9),
          password,
        })
      ).status,
      202,
    );
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    userId = user.id;
    assert.notEqual(user.passwordHash, password);
    assert.equal((await send('/auth/login', { email, password })).status, 403);
    assert.equal((await send('/auth/verify-email', { token: tokens.get(email) })).status, 200);
    assert.equal((await send('/auth/verify-email', { token: tokens.get(email) })).status, 400);
    for (let i = 0; i < 5; i++)
      assert.equal(
        (await send('/auth/login', { email, password: 'wrong' })).status,
        i === 4 ? 429 : 401,
      );
    assert.equal((await send('/auth/login', { email, password })).status, 429);
    await db.user.update({
      where: { id: user.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });
    const login = await send('/auth/login', { email, password });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    assert(login.headers.get('set-cookie')!.toLowerCase().includes('httponly'));
    const payload = {
      type: 'FOUND',
      title: 'Түлхүүр',
      description: 'Номын сан',
      category: 'KEYS',
      location: 'LIBRARY',
      occurredOn: '2026-09-20',
      handoverMethod: 'GUARD',
    };
    assert.equal((await send('/posts', payload, cookie)).status, 400);
    const created = await send('/posts', { ...payload, guardLocation: 'MAIN' }, cookie);
    assert.equal(created.status, 201);
    const value = await created.json();
    postId = value.data.id;
    assert(!JSON.stringify(value).includes(user.studentCode));
    const list = await fetch(base + '/posts', { headers: { Cookie: cookie } });
    assert.equal(list.status, 200);
    assert((await list.json()).data.items.some((p: any) => p.id === postId));
    await db.user.update({ where: { id: user.id }, data: { blockedAt: new Date() } });
    assert.equal((await fetch(base + '/users/me', { headers: { Cookie: cookie } })).status, 403);
    await db.user.update({ where: { id: user.id }, data: { blockedAt: null } });
    assert.equal((await send('/auth/logout', {}, cookie)).status, 200);
    assert.equal((await fetch(base + '/users/me', { headers: { Cookie: cookie } })).status, 401);
  } finally {
    if (postId) await db.post.delete({ where: { id: postId } });
    if (userId) await db.user.delete({ where: { id: userId } });
    await app.close();
    await db.$disconnect();
  }
});
