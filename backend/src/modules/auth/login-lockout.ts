/**
 * CampusFind — нэвтрэх оролдлогыг хязгаарлах бодлого (US-02).
 *
 * Лаб 13: AI-аар бичүүлж review хийсэн бодлогыг (labs/lab13/login-lockout/ai-log.md)
 * AuthService.login-д нэгтгэсэн хувилбар. Тоолуурыг DB дээр Prisma-гийн atomic
 * `increment`-ээр нэмсээр байна; энэ модуль зөвхөн шийдвэр гаргах цэвэр логик.
 */

/** Дараалсан буруу оролдлогын дээд тоо. */
export const MAX_FAILED_ATTEMPTS = 5;

/** Түгжих хугацаа: 10 минут (ms). */
export const LOCK_DURATION_MS = 10 * 60 * 1000;

export type LockState = { lockedUntil: Date | null };

export type FailureOutcome =
  | { locked: true; lockedUntil: Date }
  | { locked: false; remainingAttempts: number };

/** Түгжээ одоо идэвхтэй эсэх. Яг `lockedUntil` агшинд түгжээ дууссан гэж үзнэ. */
export function isLocked(state: LockState, now: Date): boolean {
  return state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();
}

/** Түгжээ байсан ч хугацаа нь дууссан эсэх. Тийм бол тоолуурыг 1-ээс эхлүүлнэ. */
export function lockExpired(state: LockState, now: Date): boolean {
  return state.lockedUntil !== null && state.lockedUntil.getTime() <= now.getTime();
}

/**
 * Буруу оролдлогыг тоолсны дараах шийдвэр.
 * @param failedAttempts DB-д нэмэгдсэний дараах дараалсан буруу оролдлогын тоо (1-ээс эхэлнэ).
 */
export function failureOutcome(failedAttempts: number, now: Date): FailureOutcome {
  if (!Number.isInteger(failedAttempts) || failedAttempts < 1)
    throw new TypeError('failedAttempts must be a positive integer');
  if (failedAttempts >= MAX_FAILED_ATTEMPTS)
    return { locked: true, lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS) };
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - failedAttempts };
}

/**
 * Review №1 (fail closed): нууц үг шалгагч яг `true` буцаасан үед л амжилт.
 * Boolean биш үр дүн (`'false'`, `1`, `undefined`) нэвтрэлтийг зөвшөөрөхгүй, алдаа шиднэ.
 */
export function passwordAccepted(result: unknown): boolean {
  if (typeof result !== 'boolean') throw new TypeError('Password check must return a boolean');
  return result;
}
