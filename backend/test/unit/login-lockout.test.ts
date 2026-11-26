import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema } from '@campusfind/contracts';
import {
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  failureOutcome,
  isLocked,
  lockExpired,
  passwordAccepted,
} from '../../src/modules/auth/login-lockout';

// Lab 13 — AI-аар бичүүлж review хийсэн түгжих бодлого CampusFind-ийн backend-д.
// Review-ийн дугаар нь labs/lab13/login-lockout/ai-log.md-ийн 4-р хэсгийн асуудлыг заана.

const NOW = new Date('2026-11-26T12:00:00.000Z');
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

test('1. Бодлого: 5 буруу оролдлого, 10 минутын түгжээ (US-02)', () => {
  // Arrange & Act & Assert
  assert.equal(MAX_FAILED_ATTEMPTS, 5);
  assert.equal(LOCK_DURATION_MS, 600000);
});

test('2. Хэвийн: 1–4 дэх буруу оролдлого түгжихгүй, үлдсэн оролдлогыг буцаана', () => {
  // Arrange
  const attempts = [1, 2, 3, 4];

  // Act
  const outcomes = attempts.map((n) => failureOutcome(n, NOW));

  // Assert
  assert.deepEqual(
    outcomes,
    [4, 3, 2, 1].map((remainingAttempts) => ({ locked: false, remainingAttempts })),
  );
});

test('3. Хил: 5 дахь (болон түүнээс хойших) буруу оролдлого яг 10 минут түгжинэ', () => {
  // Arrange
  const expected = { locked: true, lockedUntil: at(LOCK_DURATION_MS) };

  // Act
  const fifth = failureOutcome(5, NOW);
  const sixth = failureOutcome(6, NOW);

  // Assert
  assert.deepEqual(fifth, expected);
  assert.deepEqual(sixth, expected);
});

test('4. Хил: яг lockedUntil агшинд түгжээ дууссан, 1 ms өмнө түгжигдсэн хэвээр', () => {
  // Arrange
  const state = { lockedUntil: NOW };

  // Act
  const before = isLocked(state, at(-1));
  const exactly = isLocked(state, NOW);

  // Assert
  assert.equal(before, true);
  assert.equal(exactly, false);
  assert.equal(lockExpired(state, NOW), true);
});

test('5. Хил: түгжээгүй хэрэглэгч түгжигдээгүй, түгжээ дуусаагүй ч биш', () => {
  // Arrange
  const state = { lockedUntil: null };

  // Act & Assert
  assert.equal(isLocked(state, NOW), false);
  assert.equal(lockExpired(state, NOW), false);
});

test('6. Review №1 fail closed: зөвхөн boolean true нэвтрүүлнэ, boolean биш утга алдаа шиднэ', () => {
  // Arrange
  const nonBoolean: unknown[] = ['true', 'false', 1, 0, {}, null, undefined];

  // Act & Assert
  assert.equal(passwordAccepted(true), true);
  assert.equal(passwordAccepted(false), false);
  for (const value of nonBoolean)
    assert.throws(() => passwordAccepted(value), TypeError, `value ${String(value)}`);
});

test('7. Review №2 хил: production-ий loginSchema нууц үгийг 128 тэмдэгтээр хязгаарлана', () => {
  // Arrange
  const body = (length: number) => ({ email: 'student@example.edu', password: 'x'.repeat(length) });

  // Act
  const max = loginSchema.safeParse(body(128));
  const tooLong = loginSchema.safeParse(body(129));
  const huge = loginSchema.safeParse(body(1_000_000));

  // Assert
  assert.equal(max.success, true);
  assert.equal(tooLong.success, false);
  assert.equal(huge.success, false);
});

test('8. Review №3 оролт: тоолуур эерэг бүхэл тоо биш бол TypeError', () => {
  // Arrange
  const invalid = [0, -1, 1.5, Number.NaN];

  // Act & Assert
  for (const value of invalid) assert.throws(() => failureOutcome(value, NOW), TypeError);
});
