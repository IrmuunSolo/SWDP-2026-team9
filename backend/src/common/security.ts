import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function checkPassword(password: string, encoded: string) {
  const [kind, salt, hex] = encoded.split('$');
  if (kind !== 'scrypt' || !salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export const maskStudentCode = (code: string) => `${code.slice(0, 3)}****`;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function isUniversityEmail(email: string, domains: string[]) {
  return domains.includes(normalizeEmail(email).split('@')[1] ?? '');
}
// Reused by weeks 12–13 resource services. Roles never replace object membership checks.
export const canReadChat = (actorId: string, finderId: string, claimantId: string) =>
  actorId === finderId || actorId === claimantId;
export function confirmationState(
  ownerId: string,
  finderId: string,
  actorId: string,
  ownerConfirmed: boolean,
  finderConfirmed: boolean,
) {
  if (ownerId === finderId) throw new Error('Оролцогчид өөр хүмүүс байна');
  if (!canReadChat(actorId, finderId, ownerId)) throw new Error('Шилжүүлгийн оролцогч биш');
  return {
    ownerConfirmed: ownerConfirmed || actorId === ownerId,
    finderConfirmed: finderConfirmed || actorId === finderId,
  };
}
