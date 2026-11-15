import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Transpile the actual client/helpers with the existing TypeScript dependency.
const dir = await mkdtemp(join(tmpdir(), 'campusfind-web-'));
const contract = import.meta.resolve('@campusfind/contracts');
for (const [source, target] of [
  ['../src/api/client.ts', 'client.mjs'],
  ['../src/features/posts/shared/postUi.ts', 'postUi.mjs'],
]) {
  const text = (await readFile(new URL(source, import.meta.url), 'utf8'))
    .replaceAll("'@campusfind/contracts'", JSON.stringify(contract))
    .replaceAll("'../../../api/client'", "'./client.mjs'");
  await writeFile(
    join(dir, target),
    ts.transpileModule(text, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText,
  );
}
after(() => rm(dir, { recursive: true, force: true }));
const { api, ApiError } = await import(pathToFileURL(join(dir, 'client.mjs')));
const { localToday, validatePost, parseQuery, queryParams, photoSelectionError, postError } =
  await import(pathToFileURL(join(dir, 'postUi.mjs')));
const valid = {
  type: 'FOUND',
  title: ' Түлхүүр ',
  description: 'Ногоон оосортой',
  category: 'KEYS',
  location: 'LIBRARY',
  occurredOn: '2026-01-01',
  handoverMethod: 'MEET',
};

test('shared validation: trim, required fields, LOST/FOUND separation, GUARD and future local date', () => {
  assert.equal(validatePost(valid).result.data.title, 'Түлхүүр');
  assert.ok(validatePost({ ...valid, title: ' ' }).errors.title);
  assert.ok(validatePost({ ...valid, handoverMethod: 'GUARD' }).errors.guardLocation);
  assert.ok(validatePost({ ...valid, occurredOn: '2999-01-01' }).errors.occurredOn);
  assert.equal(validatePost({ ...valid, type: 'LOST' }).result.success, false);
  const local = new Date(2026, 10, 15, 0, 1);
  assert.equal(localToday(local), '2026-11-15');
});
test('query: canonical empty parameters, pagination, combined filters, invalid range/page', () => {
  const result = parseQuery(
    '?q=%20keys%20&type=FOUND&category=KEYS&location=MAIN&from=2026-01-01&to=2026-02-01&page=2&pageSize=10&ignored=x',
  );
  assert.ok(result.success);
  assert.equal(result.data.q, 'keys');
  assert.equal(queryParams(result.data).page, 2);
  assert.deepEqual(queryParams(parseQuery('?q=&type=&page=1').data), {});
  assert.equal(parseQuery('?from=2026-02-01&to=2026-01-01').success, false);
  assert.equal(parseQuery('?page=0').success, false);
});
test('photo limits: MIME, strictly under 5MB and total count', () => {
  assert.equal(photoSelectionError([{ type: 'image/png', size: 12 }], 2), '');
  assert.ok(photoSelectionError([{ type: 'image/png', size: 5 * 1024 * 1024 }], 0));
  assert.ok(photoSelectionError([{ type: 'image/gif', size: 12 }], 0));
  assert.ok(photoSelectionError([{ type: 'image/jpeg', size: 12 }], 3));
});
test('transport: cookie/CSRF, multipart browser boundary, binary, errors/expired session and abort', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  globalThis.window = new EventTarget();
  let expired = 0;
  globalThis.window.addEventListener('campusfind:session-expired', () => expired++);
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, '/api/v1/posts/id/photos');
      assert.equal(init.credentials, 'include');
      assert.equal(init.headers['X-CampusFind'], 'web');
      assert.equal(init.headers['Content-Type'], undefined);
      assert.ok(init.body instanceof FormData);
      assert.equal(init.body.get('file').name, 'test.png');
      return Response.json(
        {
          data: {
            id: '22222222-2222-4222-8222-222222222222',
            url: '/api/v1/photos/id',
            mimeType: 'image/png',
            bytes: 1,
          },
        },
        { status: 201 },
      );
    };
    const body = new FormData();
    body.append('file', new File(['x'], 'test.png', { type: 'image/png' }));
    await api('uploadPhoto', { params: { postId: 'id' }, body });
    globalThis.fetch = async () =>
      new Response('binary', { headers: { 'Content-Type': 'image/png' } });
    assert.ok((await api('getPhoto', { params: { photoId: 'id' } })) instanceof Blob);
    globalThis.fetch = async () => new Response('html error', { status: 401 });
    await assert.rejects(api('listPosts'), ApiError);
    assert.equal(expired, 1);
    for (const status of [403, 501, 503]) {
      globalThis.fetch = async () =>
        Response.json(
          {
            error: {
              message: 'error',
              code: 'CODE',
              details: [{ path: ['title'], message: 'invalid' }],
            },
          },
          { status },
        );
      await assert.rejects(
        api('createPost', { body: {} }),
        (e) => e.status === status && e.details[0].path[0] === 'title',
      );
      assert.ok(postError(new ApiError(status, 'error')).length > 10);
    }
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException('aborted', 'AbortError');
    globalThis.fetch = async () => {
      throw abort;
    };
    await assert.rejects(api('listPosts', { signal: controller.signal }), (e) => e === abort);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
