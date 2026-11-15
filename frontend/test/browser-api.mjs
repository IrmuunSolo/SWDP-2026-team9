// Real API/browser smoke: isolated campusfind_test only. Never imports HTTP fixtures.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || new URL(testUrl).pathname !== '/campusfind_test')
  throw new Error('Тусдаа campusfind_test DB шаардлагатай.');
process.env.DATABASE_URL = testUrl;
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@campusfind/database');
const root = fileURLToPath(new URL('../../', import.meta.url));
const { hashPassword } = require(join(root, 'backend/dist/src/common/security.js'));
const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)))
  : await import('playwright');
const apiPort = process.env.QA_API_PORT || '13001';
const webPort = process.env.QA_REAL_WEB_PORT || '5175';
const base = `http://localhost:${webPort}`;
const db = new PrismaClient();
const children = [];
let userId, browser;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function ready(url) {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // The API may still be starting; retry until the readiness deadline.
    }
    await delay(200);
  }
  throw new Error('QA server failed to start');
}
function start(args, cwd, env) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    windowsHide: true,
    stdio: 'ignore',
  });
  children.push(child);
  return child;
}
try {
  const password = randomBytes(20).toString('hex');
  const email = `web-${Date.now()}@example.edu`;
  const user = await db.user.create({
    data: {
      email,
      displayName: 'Browser QA',
      studentCode: 'T' + String(Date.now()).slice(-9),
      emailVerifiedAt: new Date(),
      passwordHash: await hashPassword(password),
    },
  });
  userId = user.id;
  start(['backend/dist/src/main.js'], root, {
    DATABASE_URL: testUrl,
    PORT: apiPort,
    HOST: '127.0.0.1',
    WEB_ORIGIN: base,
    UNIVERSITY_EMAIL_DOMAINS: 'example.edu',
    NODE_ENV: 'development',
  });
  start(
    [
      join(root, 'node_modules/vite/bin/vite.js'),
      '--host',
      'localhost',
      '--port',
      webPort,
      '--strictPort',
    ],
    join(root, 'frontend'),
    { API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` },
  );
  await ready(`http://127.0.0.1:${apiPort}/api/v1/health/ready`);
  await ready(base);
  browser = await chromium.launch({
    headless: true,
    ...(process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/login');
  await page.locator('[name=email]').fill(email);
  await page.locator('[name=password]').fill(password);
  await page.getByRole('button', { name: 'Нэвтрэх', exact: true }).click();
  await page.waitForURL('**/posts');
  for (const type of ['lost', 'found']) {
    await page.goto(base + `/posts/new/${type}`);
    await page.locator('[name=title]').fill(`QA ${type}`);
    await page.locator('[name=description]').fill('Зөвхөн тусдаа test DB дээрх browser шалгалт.');
    await page.locator('[name=category]').selectOption('KEYS');
    await page.locator('[name=location]').selectOption('LIBRARY');
    await page.locator('[name=occurredOn]').fill('2026-01-01');
    if (type === 'found') {
      await page.getByLabel('Шилжүүлэх арга').selectOption('GUARD');
      await page.locator('[name=guardLocation]').selectOption('MAIN');
      await page.locator('input[type=file]').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          'base64',
        ),
      });
    }
    await page.getByRole('button', { name: 'Зар нийтлэх', exact: true }).click();
    await page
      .getByText(
        type === 'lost'
          ? 'Зар амжилттай нийтлэгдлээ.'
          : 'Зар нийтлэгдсэн, зураг бүрэн илгээгдээгүй.',
        { exact: false },
      )
      .waitFor();
    if (type === 'found') {
      const count = await db.post.count({ where: { authorId: userId } });
      await page.getByRole('button', { name: 'Илгээгдээгүй зургийг дахин илгээх' }).click();
      await page
        .getByText('Зар нийтлэгдсэн, зураг бүрэн илгээгдээгүй.', { exact: false })
        .waitFor();
      await page
        .getByRole('button', { name: 'Илгээгдээгүй зургийг дахин илгээх' })
        .waitFor({ state: 'visible' });
      assert.equal(await db.post.count({ where: { authorId: userId } }), count);
    }
    await page.getByRole('link', { name: 'Нийтэлсэн зарыг харах' }).click();
    await page.getByRole('heading', { name: `QA ${type}`, exact: true }).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: `QA ${type}`, exact: true }).waitFor();
  }
  await page.goto(base + '/posts');
  await page.getByRole('link', { name: 'QA found', exact: true }).waitFor();
  await page.locator('[name=q]').fill('QA');
  await page.getByRole('button', { name: 'Хайх', exact: true }).click();
  await page.getByText('сервер тал хараахан хэрэгжээгүй', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Шүүлтүүр цэвэрлэх' }).click();
  await page.getByRole('link', { name: 'QA found', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Гарах', exact: true }).click();
  await page.waitForURL('**/login');
  assert.equal(await db.session.count({ where: { userId } }), 0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS REAL API + PostgreSQL: login cookie, LOST, FOUND/GUARD, list/detail/reload, search/upload 501, retry creates no duplicate post, logout revoke. SMTP not tested.',
  );
} finally {
  if (browser) await browser.close();
  for (const child of children) child.kill();
  if (userId) {
    await db.post.deleteMany({ where: { authorId: userId } });
    await db.user.delete({ where: { id: userId } });
  }
  await db.$disconnect();
}
