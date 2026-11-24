import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateRegistration } from './registrationValidation.js';

const valid = Object.freeze({
  displayName: 'Demo Student',
  email: 'student@example.edu',
  studentCode: 'B232270021',
  password: 'demo-pass-1234',
});
const deps = { getAllowedDomains: () => ['example.edu'] };

test('accepts a valid registration', () => {
  // Arrange
  const input = { ...valid };
  // Act
  const result = validateRegistration(input, deps);
  // Assert
  assert.deepEqual(result, { ok: true, value: valid });
  assert.notEqual(result.value, input);
});

test('normalizes the form without mutating it or trimming the password', () => {
  // Arrange
  const input = Object.freeze({
    displayName: '  Demo Student ',
    email: ' Student@EXAMPLE.EDU ',
    studentCode: ' B232270021 ',
    password: '  demo-pass  ',
  });
  // Act
  const result = validateRegistration(input, deps);
  // Assert
  assert.deepEqual(result, { ok: true, value: { ...valid, password: input.password } });
  assert.equal(input.email, ' Student@EXAMPLE.EDU ');
});

test('accepts the exact minimum and maximum lengths', () => {
  // Arrange
  const inputs = [
    [2, 12],
    [80, 128],
  ].map(([name, password]) => ({
    ...valid,
    displayName: 'A'.repeat(name),
    password: 'a'.repeat(password),
  }));
  // Act
  const results = inputs.map((input) => validateRegistration(input, deps));
  // Assert
  assert.deepEqual(
    results,
    inputs.map((value) => ({ ok: true, value })),
  );
});

test('rejects name and password just outside both limits', () => {
  // Arrange
  const inputs = [
    [1, 11],
    [81, 129],
  ].map(([name, password]) => ({
    ...valid,
    displayName: 'A'.repeat(name),
    password: 'a'.repeat(password),
  }));
  // Act
  const results = inputs.map((input) => validateRegistration(input, deps));
  // Assert
  assert.deepEqual(
    results,
    ['TOO_SHORT', 'TOO_LONG'].map((error) => ({
      ok: false,
      errors: { displayName: error, password: error },
    })),
  );
});

test('matches the production string lengths for supplementary Unicode characters', () => {
  // Arrange
  const minimum = { ...valid, displayName: '😀', password: '😀'.repeat(6) };
  const oversized = { ...valid, displayName: '😀'.repeat(41), password: '😀'.repeat(65) };
  // Act
  const accepted = validateRegistration(minimum, deps);
  const rejected = validateRegistration(oversized, deps);
  // Assert
  assert.deepEqual(accepted, { ok: true, value: minimum });
  assert.deepEqual(rejected, {
    ok: false,
    errors: { displayName: 'TOO_LONG', password: 'TOO_LONG' },
  });
});

test('validates the ASCII email syntax before case normalization', () => {
  // Arrange
  const input = { ...valid, email: 'student@Kampus.edu' };
  const customDeps = { getAllowedDomains: () => ['kampus.edu'] };
  // Act
  const result = validateRegistration(input, customDeps);
  // Assert
  assert.deepEqual(result, { ok: false, errors: { email: 'INVALID_FORMAT' } });
});

test('calls the domain provider exactly once for a valid email', (t) => {
  // Arrange
  const getAllowedDomains = t.mock.fn(() => ['other.edu', 'example.edu']);
  // Act
  const result = validateRegistration(valid, { getAllowedDomains });
  // Assert
  assert.equal(result.ok, true);
  assert.equal(getAllowedDomains.mock.callCount(), 1);
});

test('rejects nonmatching domains including subdomains and similar names', () => {
  // Arrange
  const domains = ['sub.example.edu', 'example.edu.invalid', 'anotherexample.edu'];
  // Act
  const results = domains.map((domain) =>
    validateRegistration({ ...valid, email: 'student@' + domain }, deps),
  );
  // Assert
  for (const result of results) {
    assert.deepEqual(result, { ok: false, errors: { email: 'DOMAIN_NOT_ALLOWED' } });
  }
});

test('enforces email length at 254 characters', () => {
  // Arrange
  const domain = ['a'.repeat(63), 'b'.repeat(63), 'c'.repeat(63), 'edu'].join('.');
  const email = 'x'.repeat(58) + '@' + domain;
  const customDeps = { getAllowedDomains: () => [domain] };
  // Act
  const accepted = validateRegistration({ ...valid, email }, customDeps);
  const rejected = validateRegistration({ ...valid, email: 'x' + email }, customDeps);
  // Assert
  assert.equal(email.length, 254);
  assert.equal(accepted.ok, true);
  assert.deepEqual(rejected, { ok: false, errors: { email: 'TOO_LONG' } });
});

test('reports all field failures without echoing the password or extra values', () => {
  // Arrange
  const input = {
    displayName: ' ',
    email: 12,
    studentCode: 'bad',
    password: 'short-demo',
    extra: 'ignored',
  };
  // Act
  const result = validateRegistration(input, deps);
  // Assert
  assert.deepEqual(result, {
    ok: false,
    errors: {
      displayName: 'REQUIRED',
      email: 'INVALID_FORMAT',
      studentCode: 'INVALID_FORMAT',
      password: 'TOO_SHORT',
      extra: 'UNKNOWN_FIELD',
    },
  });
});

test('rejects unknown own keys even when they are non-enumerable', () => {
  // Arrange
  const input = Object.defineProperty({ ...valid }, 'extra', { value: true });
  // Act
  const result = validateRegistration(input, deps);
  // Assert
  assert.deepEqual(result, { ok: false, errors: { extra: 'UNKNOWN_FIELD' } });
});

test('requires form fields to be supplied as own properties', () => {
  // Arrange
  const input = Object.create(valid);
  // Act
  const result = validateRegistration(input, deps);
  // Assert
  assert.deepEqual(result, {
    ok: false,
    errors: {
      displayName: 'REQUIRED',
      email: 'REQUIRED',
      studentCode: 'REQUIRED',
      password: 'REQUIRED',
    },
  });
});

test('throws TypeError for invalid form containers or dependency contracts', () => {
  // Arrange
  const invalidCalls = [
    [null, deps],
    [[], deps],
    [42, deps],
    [valid, {}],
    [valid, { getAllowedDomains: () => 'example.edu' }],
    [valid, { getAllowedDomains: () => [42] }],
  ];
  // Act
  const validate = invalidCalls.map((args) => () => validateRegistration(...args));
  // Assert
  for (const call of validate) assert.throws(call, TypeError);
});
