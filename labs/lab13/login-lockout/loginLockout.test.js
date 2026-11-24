import test from 'node:test';
import assert from 'node:assert/strict';

import {
  attemptLogin,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,
  MAX_PASSWORD_LENGTH,
} from './loginLockout.js';

const createDeps = (isPasswordValid, currentTime = 1000000) => ({
  verifyPassword: async () => isPasswordValid,
  now: () => currentTime,
});

// Тест 1–5: AI-ийн тодорхой prompt-оор бичсэн тестүүд (review хийж хэвээр үлдээсэн).

// 1. Хэвийн: зөв нууц үг тоолуурыг 0 болгоно.
test('should reset failed attempts after successful login', async () => {
  // Arrange
  const state = { failedAttempts: 3, lockedUntil: null };
  const deps = createDeps(true);

  // Act
  const response = await attemptLogin(state, 'correct-password', deps);

  // Assert
  assert.equal(response.result, 'OK');
  assert.deepEqual(response.state, { failedAttempts: 0, lockedUntil: null });
  assert.equal(response.remainingAttempts, MAX_FAILED_ATTEMPTS);
  assert.deepEqual(state, { failedAttempts: 3, lockedUntil: null });
});

// 2. Хэвийн: буруу нууц үг тоолуурыг нэмнэ.
test('should increment failed attempts after incorrect password', async () => {
  // Arrange
  const state = { failedAttempts: 2, lockedUntil: null };
  const deps = createDeps(false);

  // Act
  const response = await attemptLogin(state, 'wrong-password', deps);

  // Assert
  assert.equal(response.result, 'INVALID');
  assert.deepEqual(response.state, { failedAttempts: 3, lockedUntil: null });
  assert.equal(response.remainingAttempts, 2);
});

// 3. Хил: 5 дахь буруу оролдлого түгжээг эхлүүлнэ.
test('should lock account after fifth failed attempt', async () => {
  // Arrange
  const currentTime = 1000000;
  const state = { failedAttempts: 4, lockedUntil: null };
  const deps = createDeps(false, currentTime);

  // Act
  const response = await attemptLogin(state, 'wrong-password', deps);

  // Assert
  assert.equal(response.result, 'LOCKED');
  assert.deepEqual(response.state, {
    failedAttempts: 5,
    lockedUntil: currentTime + LOCK_DURATION_MS,
  });
  assert.equal(response.retryAfterMs, LOCK_DURATION_MS);
});

// 4. Хил: яг lockedUntil агшинд түгжээ дууссан байна.
test('should allow login when current time equals lockedUntil', async () => {
  // Arrange
  const lockedUntil = 2000000;
  const state = { failedAttempts: 5, lockedUntil };
  const deps = createDeps(true, lockedUntil);

  // Act
  const response = await attemptLogin(state, 'correct-password', deps);

  // Assert
  assert.equal(response.result, 'OK');
  assert.deepEqual(response.state, { failedAttempts: 0, lockedUntil: null });
  assert.deepEqual(state, { failedAttempts: 5, lockedUntil });
});

// 5. Mock: түгжигдсэн үед verifyPassword дуудагдахгүй.
test('should not call verifyPassword while account is locked', async (t) => {
  // Arrange
  const currentTime = 1000000;
  const lockedUntil = currentTime + LOCK_DURATION_MS;
  const state = { failedAttempts: 5, lockedUntil };
  const verifyPassword = t.mock.fn(async () => true);
  const deps = { verifyPassword, now: () => currentTime };

  // Act
  const response = await attemptLogin(state, 'correct-password', deps);

  // Assert
  assert.equal(response.result, 'LOCKED');
  assert.equal(response.retryAfterMs, LOCK_DURATION_MS);
  assert.equal(verifyPassword.mock.callCount(), 0);
  assert.deepEqual(response.state, { failedAttempts: 5, lockedUntil });
});

// Тест 6–9: review-ээр илэрсэн дутуу хэсгүүдэд Г.Нармандах нэмсэн.

// 6. Аюулгүй байдал (review №1): boolean биш truthy утга нэвтрүүлэхгүй (fail closed).
test('should not log in when verifyPassword resolves a non-boolean value', async () => {
  // Arrange
  const state = { failedAttempts: 0, lockedUntil: null };
  const deps = createDeps('false');

  // Act
  const attempt = attemptLogin(state, 'any-password', deps);

  // Assert
  await assert.rejects(attempt, TypeError);
});

// 7. Хил (review №2): түгжээ дууссаны дараах буруу оролдлого 6 биш 1 болно.
test('should start counting from one after an expired lock and a wrong password', async () => {
  // Arrange
  const lockedUntil = 2000000;
  const state = { failedAttempts: 5, lockedUntil };
  const deps = createDeps(false, lockedUntil + 1);

  // Act
  const response = await attemptLogin(state, 'wrong-password', deps);

  // Assert
  assert.equal(response.result, 'INVALID');
  assert.deepEqual(response.state, { failedAttempts: 1, lockedUntil: null });
  assert.equal(response.remainingAttempts, MAX_FAILED_ATTEMPTS - 1);
});

// 8. Mock (review №3): хэт урт нууц үгийг hash шалгагч руу дамжуулахгүй, буруу гэж тоолно.
test('should not pass an over-long password to verifyPassword', async (t) => {
  // Arrange
  const state = { failedAttempts: 0, lockedUntil: null };
  const verifyPassword = t.mock.fn(async () => true);
  const deps = { verifyPassword, now: () => 1000000 };
  const longPassword = 'a'.repeat(MAX_PASSWORD_LENGTH + 1);

  // Act
  const response = await attemptLogin(state, longPassword, deps);

  // Assert
  assert.equal(verifyPassword.mock.callCount(), 0);
  assert.equal(response.result, 'INVALID');
  assert.deepEqual(response.state, { failedAttempts: 1, lockedUntil: null });
});

// 9. Оролтын шалгалт: буруу state болон deps TypeError шиднэ.
test('should reject invalid state and dependencies with TypeError', async () => {
  // Arrange
  const deps = createDeps(true);
  const validState = { failedAttempts: 0, lockedUntil: null };

  // Act + Assert
  await assert.rejects(attemptLogin({ failedAttempts: -1, lockedUntil: null }, 'p', deps), TypeError);
  await assert.rejects(attemptLogin({ failedAttempts: 1.5, lockedUntil: null }, 'p', deps), TypeError);
  await assert.rejects(attemptLogin({ failedAttempts: 0, lockedUntil: '10' }, 'p', deps), TypeError);
  await assert.rejects(attemptLogin(validState, 'p', { now: () => 1 }), TypeError);
});
