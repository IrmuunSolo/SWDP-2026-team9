/**
 * CampusFind — нэвтрэх оролдлогыг хязгаарлах бодлого (US-02).
 *
 * Анхны хувилбарыг AI хэрэгслээр бичүүлж, review хийсний дараа зассан.
 * Prompt, AI-ийн анхны хариу ба засварын тайлбар: ./ai-log.md
 */

/** Дараалсан буруу оролдлогын дээд тоо. */
export const MAX_FAILED_ATTEMPTS = 5;

/** Түгжих хугацаа: 10 минут (ms). */
export const LOCK_DURATION_MS = 10 * 60 * 1000;

/**
 * Нууц үгийн дээд урт. `loginSchema` (packages/contracts)-тэй ижил.
 * Үүнээс урт оролтыг hash шалгагч руу дамжуулахгүй.
 */
export const MAX_PASSWORD_LENGTH = 128;

/**
 * @typedef {{ failedAttempts: number, lockedUntil: number | null }} LockoutState
 * @typedef {{
 *   verifyPassword: (password: string) => Promise<boolean>,
 *   now: () => number
 * }} LockoutDeps
 * @typedef {{
 *   result: 'OK' | 'INVALID' | 'LOCKED',
 *   state: LockoutState,
 *   retryAfterMs?: number,
 *   remainingAttempts?: number
 * }} LockoutResult
 */

/**
 * @param {unknown} state
 * @returns {asserts state is LockoutState}
 */
function assertState(state) {
  const valid =
    state !== null &&
    typeof state === 'object' &&
    !Array.isArray(state) &&
    Number.isInteger(state.failedAttempts) &&
    state.failedAttempts >= 0 &&
    (state.lockedUntil === null || Number.isFinite(state.lockedUntil));
  if (!valid) throw new TypeError('Invalid state');
}

/**
 * @param {unknown} deps
 * @returns {asserts deps is LockoutDeps}
 */
function assertDeps(deps) {
  const valid =
    deps !== null &&
    typeof deps === 'object' &&
    typeof deps.verifyPassword === 'function' &&
    typeof deps.now === 'function';
  if (!valid) throw new TypeError('Invalid dependencies');
}

/**
 * Буруу оролдлогыг тоолж, шаардлагатай бол түгжинэ.
 *
 * @param {number} failedAttempts
 * @param {number} currentTime
 * @returns {LockoutResult}
 */
function registerFailure(failedAttempts, currentTime) {
  const attempts = failedAttempts + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return {
      result: 'LOCKED',
      state: { failedAttempts: attempts, lockedUntil: currentTime + LOCK_DURATION_MS },
      retryAfterMs: LOCK_DURATION_MS,
    };
  }
  return {
    result: 'INVALID',
    state: { failedAttempts: attempts, lockedUntil: null },
    remainingAttempts: MAX_FAILED_ATTEMPTS - attempts,
  };
}

/**
 * Түгжих бодлогыг баримталж нэвтрэх оролдлогыг үнэлнэ.
 *
 * - Оролтын `state`-ийг өөрчлөхгүй, шинэ state буцаана.
 * - Түгжигдсэн үед нууц үгийг шалгахгүй.
 * - `verifyPassword` зөвхөн яг `true` буцаасан үед амжилттай гэж үзнэ (fail closed).
 * - Нууц үгийг log хийхгүй, буцаах утгад оруулахгүй.
 *
 * @param {LockoutState} state
 * @param {string} password
 * @param {LockoutDeps} deps
 * @returns {Promise<LockoutResult>}
 * @throws {TypeError} Оролт буруу эсвэл `verifyPassword` boolean буцаагаагүй үед.
 */
export async function attemptLogin(state, password, deps) {
  assertState(state);
  assertDeps(deps);
  if (typeof password !== 'string') throw new TypeError('Password must be a string');

  const currentTime = deps.now();
  if (!Number.isFinite(currentTime)) throw new TypeError('now() must return a finite number');

  if (state.lockedUntil !== null && currentTime < state.lockedUntil) {
    return {
      result: 'LOCKED',
      state: { failedAttempts: state.failedAttempts, lockedUntil: state.lockedUntil },
      retryAfterMs: state.lockedUntil - currentTime,
    };
  }

  // Түгжээ дууссан бол тоолуурыг шинээр эхлүүлнэ.
  const failedAttempts = state.lockedUntil === null ? state.failedAttempts : 0;

  // Хэт урт нууц үг: hash шалгагчийг ачаалахгүйгээр буруу оролдлого гэж тоолно.
  if (password.length > MAX_PASSWORD_LENGTH) return registerFailure(failedAttempts, currentTime);

  const isValid = await deps.verifyPassword(password);
  if (typeof isValid !== 'boolean') {
    throw new TypeError('verifyPassword must resolve to a boolean');
  }
  if (isValid === true) {
    return {
      result: 'OK',
      state: { failedAttempts: 0, lockedUntil: null },
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }
  return registerFailure(failedAttempts, currentTime);
}
