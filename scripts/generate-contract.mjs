import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { routes, errorSchema } = require('@campusfind/contracts');
const { zodToJsonSchema } = require('zod-to-json-schema');
const schema = (s) => zodToJsonSchema(s, { $refStrategy: 'none', target: 'openApi3' });
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'CampusFind API',
    version: '0.1.0',
    description:
      'Суурь API гэрээ. x-implementation=planned үйлдэл 501 буцаана; success schema нь дараагийн хэрэгжүүлэлтийн гэрээ.',
  },
  servers: [{ url: 'http://localhost:3000/api/v1' }],
  components: {
    securitySchemes: { session: { type: 'apiKey', in: 'cookie', name: 'campusfind_session' } },
  },
  paths: {},
};
for (const r of routes) {
  const errors = Object.fromEntries(
    [
      400,
      401,
      403,
      404,
      409,
      429,
      500,
      503,
      ...(r.status === 'planned' || r.id === 'listPosts' ? [501] : []),
    ].map((status) => [
      status,
      {
        description: String(status),
        content: { 'application/json': { schema: schema(errorSchema) } },
      },
    ]),
  );
  const parameters = [...r.path.matchAll(/\{([^}]+)\}/g)].map((m) => ({
    name: m[1],
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  }));
  if (r.query) {
    const q = schema(r.query);
    for (const [name, value] of Object.entries(q.properties ?? {}))
      parameters.push({ name, in: 'query', required: false, schema: value });
  }
  if (['listMessages', 'listNotifications', 'listComments', 'adminReports'].includes(r.id))
    parameters.push(
      { name: 'after', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      },
    );
  const binary = r.id === 'getPhoto';
  const op = {
    operationId: r.id,
    summary: r.summary,
    tags: [r.path.split('/')[1]],
    'x-owner': r.owner,
    'x-week-block': r.weekBlock,
    'x-frontend-owner': r.frontendOwner,
    'x-data-owner': r.dataOwner,
    'x-stories': r.stories,
    'x-access': r.access,
    'x-implementation': r.status,
    security: r.access === 'PUBLIC' ? [] : [{ session: [] }],
    parameters,
    responses: {
      [r.success]: {
        description: r.status === 'planned' ? 'Planned success contract' : 'Success',
        content: binary
          ? {
              'image/jpeg': { schema: { type: 'string', format: 'binary' } },
              'image/png': { schema: { type: 'string', format: 'binary' } },
            }
          : {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data'],
                  properties: { data: schema(r.output) },
                },
              },
            },
      },
      ...errors,
    },
  };
  if (r.method !== 'get')
    op.parameters.push({
      name: 'X-CampusFind',
      in: 'header',
      required: true,
      schema: { type: 'string', enum: ['web'] },
    });
  if (r.input)
    op.requestBody = {
      required: true,
      content: { 'application/json': { schema: schema(r.input) } },
    };
  if (r.id === 'uploadPhoto')
    op.requestBody = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: { file: { type: 'string', format: 'binary' } },
          },
        },
      },
    };
  (spec.paths[r.path] ??= {})[r.method] = op;
}
const md = [
  '# API замууд',
  '',
  'Эх гэрээ: `packages/contracts/src/index.ts`. Энэ хүснэгт ба OpenAPI-г `npm run contract:generate` командаар үүсгэнэ.',
  '',
  '| Method | Зам /api/v1 | Эрх | Долоо хоног | API owner | Frontend | Database | Төлөв | Үүрэг |',
  '|---|---|---|---|---|---|---|---|---|',
  ...routes.map(
    (r) =>
      `| ${r.method.toUpperCase()} | ${r.path} | ${r.access} | ${r.weekBlock} | ${r.owner} | ${r.frontendOwner} | ${r.dataOwner} | ${r.status} | ${r.summary} |`,
  ),
  '',
].join('\n');
await mkdir(new URL('../docs/api/', import.meta.url), { recursive: true });
for (const [name, content] of [
  ['openapi.json', JSON.stringify(spec, null, 2) + '\n'],
  ['routes.md', md],
]) {
  const url = new URL('../docs/api/' + name, import.meta.url);
  if (process.argv.includes('--check')) {
    if ((await readFile(url, 'utf8')) !== content)
      throw new Error(name + ' хуучирсан. npm run contract:generate ажиллуул');
  } else await writeFile(url, content);
}
console.log(
  `${routes.length} API гэрээ ${process.argv.includes('--check') ? 'шалгалаа' : 'үүсгэлээ'}`,
);
