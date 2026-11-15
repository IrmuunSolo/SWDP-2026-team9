// Test-only HTTP fixtures. No fixture is imported by production code.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const playwright = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)))
  : await import('playwright');
const { chromium } = playwright;
const output = process.env.QA_OUTPUT_DIR || join(tmpdir(), 'campusfind-w10-11-qa');
await mkdir(output, { recursive: true });
const root = fileURLToPath(new URL('../../', import.meta.url));
const port = process.env.QA_PORT || '5174';
const base = `http://localhost:${port}`;
const server = spawn(
  process.execPath,
  [
    join(root, 'node_modules/vite/bin/vite.js'),
    '--host',
    'localhost',
    '--port',
    port,
    '--strictPort',
  ],
  { cwd: join(root, 'frontend'), windowsHide: true, stdio: 'pipe' },
);
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let browser;
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  displayName: 'Тест хэрэглэгч',
  studentCodeMasked: 'T26****',
  role: 'MEMBER',
};
const post = {
  id: '22222222-2222-4222-8222-222222222222',
  author: user,
  type: 'LOST',
  status: 'ACTIVE',
  title: 'Ногоон оосортой түлхүүр',
  description: 'Номын сангийн үүдэнд гээсэн.',
  category: 'KEYS',
  location: 'LIBRARY',
  occurredOn: '2026-01-01',
  handoverMethod: null,
  guardLocation: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};
const photoId = (n) => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;
let listMode = 'normal',
  createFailures = 0,
  createCount = 0,
  uploadCount = 0,
  failSecond = true,
  imageFail = false,
  uploadStatus = 0;
let oldRelease, oldStarted;
const oldGate = new Promise((r) => (oldRelease = r));
const oldSeen = new Promise((r) => (oldStarted = r));
const uploadNames = [];
const errors = [],
  consoleErrors = [];
let page;
const checkText = async (text) => {
  await page.getByText(text, { exact: false }).first().waitFor();
};
async function fillPost(found = false) {
  await page.locator('[name=title]').fill('Ногоон оосортой түлхүүр');
  await page.locator('[name=description]').fill('Номын сангийн үүдэнд гээсэн.');
  await page.locator('[name=category]').selectOption('KEYS');
  await page.locator('[name=location]').selectOption('LIBRARY');
  await page.locator('[name=occurredOn]').fill('2026-01-01');
  if (found) {
    await page.getByLabel('Шилжүүлэх арга').selectOption('GUARD');
    await page.locator('[name=guardLocation]').selectOption('MAIN');
  }
}
try {
  for (let n = 0; n < 60; n++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await delay(200);
    if (n === 59) throw new Error('Vite did not start: ' + serverLog);
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {}),
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(m.text());
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const ok = (data, status = 200) => route.fulfill({ status, json: { data } });
    const fail = (status) =>
      route.fulfill({
        status,
        json: { error: { code: 'TEST_ERROR', message: 'Тест алдаа', requestId: 'fixture' } },
      });
    if (path === '/users/me') return ok(user);
    if (path === '/posts' && request.method() === 'GET') {
      if (url.searchParams.get('q') === 'old') {
        oldStarted();
        await oldGate;
        return ok({
          items: [{ ...post, title: 'OLD RESULT' }],
          meta: { page: 1, pageSize: 20, total: 1 },
        }).catch(() => {});
      }
      if (listMode === 'network') return route.abort('failed');
      if (Number(listMode)) return fail(Number(listMode));
      const pageNo = Number(url.searchParams.get('page') || 1);
      const empty = listMode === 'empty';
      return ok({
        items: empty
          ? []
          : [
              {
                ...post,
                title:
                  url.searchParams.get('q') === 'new' ? 'NEW RESULT' : `${post.title} ${pageNo}`,
              },
            ],
        meta: {
          page: pageNo,
          pageSize: Number(url.searchParams.get('pageSize') || 20),
          total: empty ? 0 : 41,
        },
      });
    }
    if (path === '/posts' && request.method() === 'POST') {
      createCount++;
      assert.equal(request.headers()['x-campusfind'], 'web');
      const body = request.postDataJSON();
      assert.equal(body.authorId, undefined);
      if (createFailures-- > 0) return fail(503);
      await delay(100);
      return ok(
        {
          ...post,
          ...body,
          handoverMethod: body.handoverMethod || null,
          guardLocation: body.guardLocation || null,
        },
        201,
      );
    }
    if (path.endsWith('/photos') && request.method() === 'POST') {
      uploadCount++;
      if (uploadStatus) return fail(uploadStatus);
      const contentType = request.headers()['content-type'];
      assert.match(contentType, /^multipart\/form-data; boundary=/);
      assert.equal(request.headers()['x-campusfind'], 'web');
      const name = /filename="([^"]+)"/.exec(request.postData() || '')?.[1];
      uploadNames.push(name);
      if (name === 'two.png' && failSecond) {
        failSecond = false;
        return fail(503);
      }
      return ok(
        {
          id: photoId(name === 'one.png' ? 1 : 2),
          url: '/unused',
          mimeType: 'image/png',
          bytes: png.length,
        },
        201,
      );
    }
    if (path.startsWith('/photos/'))
      return imageFail ? fail(501) : route.fulfill({ contentType: 'image/png', body: png });
    if (path === `/posts/${post.id}`) return ok(post);
    return fail(404);
  });
  await page.goto(base + '/posts');
  await checkText(post.title);
  assert.match(await page.title(), /CampusFind/);
  assert.match(page.url(), /\/posts$/);
  assert.equal(await page.locator('vite-error-overlay').count(), 0);
  await page.screenshot({ path: join(output, 'desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Дараах', exact: true }).click();
  await checkText('2-р хуудас');
  await page.locator('[name=q]').fill('түлхүүр');
  await page.getByRole('button', { name: 'Хайх', exact: true }).click();
  await checkText('1-р хуудас');
  assert.ok(!new URL(page.url()).searchParams.has('page'));
  await page.reload();
  assert.equal(await page.locator('[name=q]').inputValue(), 'түлхүүр');
  await page.goBack();
  await checkText('2-р хуудас');
  await page.goForward();
  await checkText('1-р хуудас');
  await page.getByRole('button', { name: 'Шүүлтүүр цэвэрлэх' }).click();
  await checkText(post.title);
  assert.equal(new URL(page.url()).search, '');
  await page.locator('[name=type]').selectOption('FOUND');
  await page.locator('[name=category]').selectOption('KEYS');
  await page.locator('[name=location]').selectOption('LIBRARY');
  await page.locator('[name=from]').fill('2026-01-01');
  await page.locator('[name=to]').fill('2026-02-01');
  await page.getByRole('button', { name: 'Хайх', exact: true }).click();
  await checkText(post.title);
  const combined = new URL(page.url()).searchParams;
  for (const [key, value] of Object.entries({
    type: 'FOUND',
    category: 'KEYS',
    location: 'LIBRARY',
    from: '2026-01-01',
    to: '2026-02-01',
  }))
    assert.equal(combined.get(key), value);
  await page.locator('[name=from]').fill('2026-02-01');
  await page.locator('[name=to]').fill('2026-01-01');
  await page.getByRole('button', { name: 'Хайх', exact: true }).click();
  await checkText('Хайлтын холбоос буруу');
  await page.getByRole('button', { name: 'Шүүлтүүр цэвэрлэх' }).click();
  await checkText(post.title);
  await page.locator('[name=q]').fill('old');
  await page.getByRole('button', { name: 'Хайх', exact: true }).click();
  await oldSeen;
  await page.locator('[name=q]').fill('new');
  await page.getByRole('button', { name: 'Хайх', exact: true }).click();
  await checkText('NEW RESULT');
  oldRelease();
  await delay(200);
  assert.equal(await page.getByText('OLD RESULT').count(), 0);
  console.log('PASS URL filters, pagination, reload, back/forward, invalid range, request race');
  listMode = 'empty';
  await page.reload();
  await checkText('Хайлтад тохирох зар олдсонгүй');
  await page.getByRole('button', { name: 'Шүүлтүүр цэвэрлэх' }).click();
  await checkText('Одоогоор зар алга');
  for (const mode of ['network', '503', '403', '501']) {
    listMode = mode;
    await page.reload();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.locator('.posts article').count(), 0);
    listMode = 'normal';
    await page.getByRole('button', { name: 'Дахин оролдох', exact: true }).click();
    await checkText(post.title);
  }
  listMode = '401';
  await page.reload();
  await page.waitForURL('**/login?reason=session-expired');
  listMode = 'normal';
  await page.goto(base + `/posts/${post.id}`);
  await page.getByRole('heading', { name: post.title }).waitFor();
  await page.goto(base + '/posts/new/found');
  await page.getByRole('button', { name: 'Зар нийтлэх', exact: true }).click();
  assert.ok(await page.locator('[name=title]').evaluate((e) => e === document.activeElement));
  await fillPost(true);
  await page.locator('[name=guardLocation]').selectOption('');
  await page.getByRole('button', { name: 'Зар нийтлэх', exact: true }).click();
  await checkText('Жижүүрийн байрыг сонгоно уу');
  await page.locator('[name=guardLocation]').selectOption('MAIN');
  await page.locator('[name=occurredOn]').fill('2999-01-01');
  await page.getByRole('button', { name: 'Зар нийтлэх', exact: true }).click();
  await checkText('Ирээдүйн огноо');
  await page.locator('[name=occurredOn]').fill('2026-01-01');
  await page
    .locator('input[type=file]')
    .setInputFiles([{ name: 'bad.gif', mimeType: 'image/gif', buffer: png }]);
  await checkText('Зөвхөн JPG/PNG');
  await page
    .locator('input[type=file]')
    .setInputFiles([
      { name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024) },
    ]);
  await checkText('Зураг тус бүр 5 MB-аас бага');
  await page.locator('input[type=file]').setInputFiles(
    ['one.png', 'two.png', 'three.png', 'four.png'].map((name) => ({
      name,
      mimeType: 'image/png',
      buffer: png,
    })),
  );
  await checkText('Нийт 3 хүртэл');
  await page.locator('input[type=file]').setInputFiles(
    ['one.png', 'two.png', 'remove.png'].map((name) => ({
      name,
      mimeType: 'image/png',
      buffer: png,
    })),
  );
  await page.getByRole('button', { name: 'remove.png зургийг хасах' }).click();
  assert.equal(await page.locator('.photo-item').count(), 2);
  createFailures = 1;
  await page.getByRole('button', { name: 'Зар нийтлэх', exact: true }).click();
  await checkText('Сервер түр ажиллахгүй');
  assert.equal(await page.locator('[name=title]').inputValue(), post.title);
  await page.locator('.post-form').evaluate((form) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await checkText('Зар нийтлэгдсэн, зураг бүрэн илгээгдээгүй');
  assert.equal(createCount, 2);
  assert.equal(uploadCount, 2);
  await page.getByRole('button', { name: 'Илгээгдээгүй зургийг дахин илгээх' }).click();
  await checkText('Зар амжилттай нийтлэгдлээ');
  assert.equal(createCount, 2);
  assert.deepEqual(uploadNames, ['one.png', 'two.png', 'two.png']);
  await page.locator('.photo-item img').first().waitFor();
  await page.screenshot({ path: join(output, 'upload-success.png'), fullPage: true });
  imageFail = true;
  // Remount a fresh flow to exercise planned binary/image error and retry.
  await page.goto(base + '/posts/new/lost');
  await fillPost();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'one.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Зар нийтлэх', exact: true }).click();
  await checkText('сервер тал хараахан хэрэгжээгүй');
  imageFail = false;
  await page.getByRole('button', { name: 'Зургийг дахин ачаалах' }).click();
  await page.locator('.photo-item img').waitFor();
  assert.ok(
    await page.locator('.photo-item img').evaluate((img) => img.complete && img.naturalWidth > 0),
  );
  for (const status of [501, 403, 401]) {
    uploadStatus = status;
    await page.goto(base + '/posts/new/lost');
    await fillPost();
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'one.png', mimeType: 'image/png', buffer: png });
    const beforeCreate = createCount;
    await page.getByRole('button', { name: 'Зар нийтлэх', exact: true }).click();
    if (status === 401) await page.waitForURL('**/login?reason=session-expired');
    else {
      await checkText('Зар нийтлэгдсэн, зураг бүрэн илгээгдээгүй');
      await page.getByRole('button', { name: 'Илгээгдээгүй зургийг дахин илгээх' }).click();
      await page.waitForFunction(
        () =>
          !document.querySelector('.post-form button[type="submit"]') &&
          document.querySelector('.post-form')?.getAttribute('aria-busy') === 'false',
      );
    }
    assert.equal(createCount, beforeCreate + 1);
  }
  uploadStatus = 0;
  console.log(
    'PASS detail, field focus, future date, GUARD, file limits/removal, create failure, duplicate submit, partial upload retry, binary image failure/retry, 401/403/501',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/posts');
  await checkText(post.title);
  await page.screenshot({ path: join(output, 'mobile.png'), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(() => document.activeElement?.tagName), 'BODY');
  await page.goto(base + '/posts/new/found');
  await fillPost(true);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: join(output, 'mobile-form.png'), fullPage: true });
  assert.deepEqual(errors, []);
  // Browser reports expected HTTP/aborted fixture requests as console errors.
  const unexpected = consoleErrors.filter(
    (message) => !/Failed to load resource|net::ERR_FAILED/.test(message),
  );
  assert.deepEqual(unexpected, []);
  console.log(
    'PASS page identity, nonblank, no overlay/runtime errors, desktop/mobile overflow, keyboard; expected fixture HTTP console errors:',
    consoleErrors.length,
  );
  console.log('Screenshots:', output);
} finally {
  oldRelease();
  if (browser) await browser.close();
  server.kill();
}
