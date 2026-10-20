import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app';
import { DbService } from '../../src/db/db.module';
import { MailService } from '../../src/modules/auth/mail.service';
import { hashToken } from '../../src/common/security';
const token = 'a'.repeat(64),
  user = {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Тест',
    email: 'test@example.edu',
    studentCode: 'B232270021',
    role: 'MEMBER',
    emailVerifiedAt: new Date(),
    blockedAt: null,
    passwordHash: 'not-public',
  };
test('HTTP foundation: routes, CSRF, privacy, auth, explicit planned errors', async (t) => {
  process.env.DATABASE_URL = 'postgresql://unused';
  process.env.UNIVERSITY_EMAIL_DOMAINS = 'example.edu';
  const db = {
    session: {
      findUnique: async ({ where }: any) =>
        where.tokenHash === hashToken(token)
          ? { user, tokenHash: where.tokenHash, expiresAt: new Date(Date.now() + 60000) }
          : null,
    },
    $queryRaw: async () => [1],
    $disconnect: async () => {},
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DbService)
    .useValue(db)
    .overrideProvider(MailService)
    .useValue({ sendVerification: async () => {} })
    .compile();
  const app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const get = (path: string, auth = false) =>
    fetch(base + '/api/v1' + path, {
      headers: auth ? { Cookie: `campusfind_session=${token}` } : {},
    });
  try {
    await t.test('liveness works without database or authentication', async () => {
      const r = await get('/health');
      assert.equal(r.status, 200);
      assert.equal((await r.json()).data.status, 'ok');
    });
    await t.test('register route validates rather than falling into reservation', async () => {
      const r = await fetch(base + '/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CampusFind': 'web' },
        body: '{}',
      });
      assert.equal(r.status, 400);
      assert.equal((await r.json()).error.code, 'VALIDATION_ERROR');
    });
    await t.test('mutation rejects missing CSRF header', async () => {
      const r = await fetch(base + '/api/v1/auth/login', { method: 'POST' });
      assert.equal(r.status, 403);
    });
    await t.test('foreign origin is rejected even with header', async () => {
      const r = await fetch(base + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'X-CampusFind': 'web', Origin: 'https://evil.test' },
      });
      assert.equal(r.status, 403);
    });
    await t.test('posts need authentication', async () =>
      assert.equal((await get('/posts')).status, 401),
    );
    await t.test('me never leaks full code, email or hash', async () => {
      const r = await get('/users/me', true);
      assert.equal(r.status, 200);
      const body = await r.text();
      assert(body.includes('B23****'));
      assert(!body.includes('B232270021'));
      assert(!body.includes('passwordHash'));
      assert(!body.includes('test@example.edu'));
    });
    await t.test('planned feature returns 501 instead of fake success', async () => {
      const r = await get('/chats', true);
      assert.equal(r.status, 501);
      assert.equal((await r.json()).error.code, 'NOT_IMPLEMENTED');
    });
    await t.test('data-layer search seam becomes HTTP 501 without querying DB', async () => {
      const r = await get('/posts?q=keys', true);
      assert.equal(r.status, 501);
      assert.equal((await r.json()).error.code, 'NOT_IMPLEMENTED');
    });
    await t.test(
      'data-layer filter seam becomes HTTP 501 without leaking internal errors',
      async () => {
        const r = await get('/posts?category=KEYS', true);
        assert.equal(r.status, 501);
        assert.equal((await r.json()).error.code, 'NOT_IMPLEMENTED');
      },
    );
    await t.test('nonadmin cannot enter admin reservation', async () =>
      assert.equal((await get('/admin/reports', true)).status, 403),
    );
    await t.test('unknown authenticated route returns uniform 404', async () => {
      const r = await get('/not-a-route', true);
      assert.equal(r.status, 404);
      assert((await r.json()).error.requestId);
    });
  } finally {
    await app.close();
  }
});
