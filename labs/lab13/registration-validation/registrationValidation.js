const FIELDS = ['displayName', 'email', 'studentCode', 'password'];
const STUDENT_CODE_PATTERN = /^[A-Z]\d{9}$/;
const EMAIL_LOCAL_PART_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

/**
 * @typedef {object} Registration
 * @property {string} displayName
 * @property {string} email
 * @property {string} studentCode
 * @property {string} password
 */

/**
 * @typedef {'REQUIRED' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_FORMAT' |
 *   'DOMAIN_NOT_ALLOWED' | 'UNKNOWN_FIELD'} ValidationError
 */

/**
 * Checks whether a value is a non-null, non-array object.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks the local part and DNS labels of a trimmed email address.
 *
 * @param {string} email
 * @returns {boolean}
 */
function hasValidEmailFormat(email) {
  const parts = email.split('@');

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  const labels = domain.split('.');

  return (
    localPart.length <= 64 &&
    EMAIL_LOCAL_PART_PATTERN.test(localPart) &&
    labels.length >= 2 &&
    labels.every((label) => DOMAIN_LABEL_PATTERN.test(label))
  );
}

/**
 * Validates and normalizes registration fields without mutating the input.
 *
 * @param {unknown} input Registration fields to validate.
 * @param {{getAllowedDomains: () => string[]}} deps Domain provider.
 * @returns {{ok: true, value: Registration} |
 *   {ok: false, errors: Record<PropertyKey, ValidationError>}}
 * @throws {TypeError} If input, deps, or the provider's result has an invalid shape.
 */
export function validateRegistration(input, deps) {
  if (!isRecord(input)) {
    throw new TypeError('input must be an object');
  }

  if (!isRecord(deps) || typeof deps.getAllowedDomains !== 'function') {
    throw new TypeError('deps.getAllowedDomains must be a function');
  }

  const allowedDomains = deps.getAllowedDomains();

  if (
    !Array.isArray(allowedDomains) ||
    [...allowedDomains].some((domain) => typeof domain !== 'string')
  ) {
    throw new TypeError('getAllowedDomains must return an array of strings');
  }

  const errors = new Map();
  const value = {};

  for (const field of Reflect.ownKeys(input)) {
    if (!FIELDS.includes(field)) {
      errors.set(field, 'UNKNOWN_FIELD');
    }
  }

  for (const field of FIELDS) {
    if (!Object.hasOwn(input, field)) {
      errors.set(field, 'REQUIRED');
      continue;
    }

    const rawValue = input[field];

    if (typeof rawValue !== 'string') {
      errors.set(field, 'INVALID_FORMAT');
      continue;
    }

    const normalized = field === 'password' ? rawValue : rawValue.trim();

    if (normalized === '') {
      errors.set(field, 'REQUIRED');
      continue;
    }

    value[field] = normalized;
  }

  for (const [field, min, max] of [
    ['displayName', 2, 80],
    ['password', 12, 128],
  ]) {
    if (Object.hasOwn(value, field)) {
      const length = value[field].length;

      if (length < min) {
        errors.set(field, 'TOO_SHORT');
      } else if (length > max) {
        errors.set(field, 'TOO_LONG');
      }
    }
  }

  if (Object.hasOwn(value, 'email')) {
    if (value.email.length > 254) {
      errors.set('email', 'TOO_LONG');
    } else if (!hasValidEmailFormat(value.email)) {
      errors.set('email', 'INVALID_FORMAT');
    } else {
      value.email = value.email.toLowerCase();
      if (!allowedDomains.includes(value.email.split('@')[1])) {
        errors.set('email', 'DOMAIN_NOT_ALLOWED');
      }
    }
  }

  if (Object.hasOwn(value, 'studentCode') && !STUDENT_CODE_PATTERN.test(value.studentCode)) {
    errors.set('studentCode', 'INVALID_FORMAT');
  }

  if (errors.size > 0) {
    return { ok: false, errors: Object.fromEntries(errors) };
  }

  return { ok: true, value };
}
