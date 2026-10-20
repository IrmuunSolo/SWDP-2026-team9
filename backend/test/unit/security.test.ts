import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  checkPassword,
  newToken,
  hashToken,
  maskStudentCode,
  isUniversityEmail,
  canReadChat,
  confirmationState,
} from '../../src/common/security';
import { createPostSchema, registerSchema, listQuerySchema, routes } from '@campusfind/contracts';
test('passwords are salted, verify correctly and never stored in plain text', async () => {
  const a = await hashPassword('correct horse battery'),
    b = await hashPassword('correct horse battery');
  assert.notEqual(a, b);
  assert(await checkPassword('correct horse battery', a));
  assert(!(await checkPassword('wrong password', a)));
  assert(!a.includes('correct horse'));
});
test('opaque tokens have 256 bits and database fingerprint differs', () => {
  const token = newToken();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(hashToken(token), token);
});
test('only exact university domains are allowed', () => {
  assert(isUniversityEmail('A@EXAMPLE.EDU', ['example.edu']));
  assert(!isUniversityEmail('a@example.edu.evil.test', ['example.edu']));
  assert(!isUniversityEmail('a@sub.example.edu', ['example.edu']));
});
test('public projection masks student identity', () =>
  assert.equal(maskStudentCode('B232270021'), 'B23****'));
test('only actual chat participants may read messages', () => {
  assert(canReadChat('finder', 'finder', 'owner'));
  assert(canReadChat('owner', 'finder', 'owner'));
  assert(!canReadChat('admin', 'finder', 'owner'));
});
test('one person confirming twice does not close handover', () => {
  const x = confirmationState('o', 'f', 'o', false, false);
  assert.deepEqual(confirmationState('o', 'f', 'o', x.ownerConfirmed, x.finderConfirmed), {
    ownerConfirmed: true,
    finderConfirmed: false,
  });
});
test('two distinct confirmations complete handover', () =>
  assert.deepEqual(confirmationState('o', 'f', 'f', true, false), {
    ownerConfirmed: true,
    finderConfirmed: true,
  }));
test('outsider cannot confirm; finder cannot be owner', () => {
  assert.throws(() => confirmationState('o', 'f', 'x', false, false));
  assert.throws(() => confirmationState('f', 'f', 'f', false, false));
});
const base = {
  title: 'Түлхүүр',
  description: 'Номын санд олдсон',
  category: 'KEYS',
  location: 'LIBRARY',
  occurredOn: '2026-09-20',
};
test('LOST accepts only its public fields', () => {
  assert(createPostSchema.safeParse({ ...base, type: 'LOST' }).success);
  assert(!createPostSchema.safeParse({ ...base, type: 'LOST', authorId: 'injected' }).success);
});
test('GUARD requires a building; MEET rejects a guard building', () => {
  assert(!createPostSchema.safeParse({ ...base, type: 'FOUND', handoverMethod: 'GUARD' }).success);
  assert(
    createPostSchema.safeParse({
      ...base,
      type: 'FOUND',
      handoverMethod: 'GUARD',
      guardLocation: 'MAIN',
    }).success,
  );
  assert(
    !createPostSchema.safeParse({
      ...base,
      type: 'FOUND',
      handoverMethod: 'MEET',
      guardLocation: 'MAIN',
    }).success,
  );
});
test('input cannot promote role or set verification', () => {
  assert(
    !registerSchema.safeParse({
      displayName: 'Оюутан',
      email: 'a@example.edu',
      password: 'strong password',
      studentCode: 'B232270021',
      role: 'ADMIN',
    }).success,
  );
});
test('list is bounded and dates are ordered', () => {
  assert.equal(listQuerySchema.parse({}).pageSize, 20);
  assert(!listQuerySchema.safeParse({ pageSize: 5000 }).success);
  assert(!listQuerySchema.safeParse({ from: '2026-10-20', to: '2026-01-01' }).success);
});
test('API ids and method/path pairs are unique', () => {
  assert.equal(new Set(routes.map((r) => r.id)).size, routes.length);
  assert.equal(new Set(routes.map((r) => r.method + r.path)).size, routes.length);
});
