# AI ашиглалтын тэмдэглэл — бүртгэлийн validation

Хариуцагч: Л.Ирмүүн. OpenAI Codex CLI v0.171.0-alpha.13, загвар gpt-6.2-sol. Prompt бүрийг repo-оос гадуур тусдаа шинэ, зөвхөн унших session-д өгсөн. Эцсийн хариуг бүтнээр нь хадгалав.

## 1. Тодорхойгүй prompt

Эхэлсэн цаг: 2026-11-24 14:58:23 (Улаанбаатар, UTC+08:00).

```text
Бүртгүүлэх формын validation бичээд өгөөч
```

### AI-ийн анхны хариу

Workspace нь зөвхөн унших эрхтэй, мөн файл жагсаах команд хориглогдсон тул формын кодыг шалгаж, файлд өөрчлөлт оруулж чадсангүй. Хэрэв форм чинь JavaScript ашигладаг бөгөөд `name`, `email`, `password`, `confirmPassword` талбартай бол энэ функцийг ашиглаж болно.

```js
function validateRegistration({ name, email, password, confirmPassword }) {
  const errors = {};

  if (!name.trim()) {
    errors.name = "Нэрээ оруулна уу.";
  }

  if (!email.trim()) {
    errors.email = "Имэйл хаягаа оруулна уу.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Имэйл хаягаа зөв оруулна уу.";
  }

  if (password.length < 8) {
    errors.password = "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Нууц үгээ давтан оруулна уу.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Нууц үг таарахгүй байна.";
  }

  return errors;
}
```

Форм илгээх үед функцийг дуудаж, `errors` хоосон биш бол илгээхийг зогсоогоод мессеж бүрийг харгалзах талбарын доор харуулна. Нууц үгийн доод уртыг жишээнд 8 гэж авсан. Үндсэн шалгалтуудыг сервер дээр мөн хийнэ.

Формын кодоо энд оруулбал одоо байгаа талбарууд болон `submit` логикт нь тааруулж өгье.

## 2. Тодорхой prompt

Эхэлсэн цаг: 2026-11-24 14:58:24 (Улаанбаатар, UTC+08:00).

```text
Node.js 24, ESM (export), гадны dependency-гүй, JavaScript дээр registrationValidation.js модуль бичээрэй. Их сургуулийн гээгдэл эд зүйлийн веб системийн бүртгэлийн маягтын цэвэр validation логик; HTTP, өгөгдлийн сан хамаарахгүй.

Функц: export function validateRegistration(input, deps)
- input: { displayName, email, studentCode, password } — бүгд string байх ёстой.
- deps: { getAllowedDomains: () => string[] } — сургуулийн зөвшөөрөгдсөн и-мэйл домэйнууд (тестэд mock хийхийн тулд гаднаас өгнө).
- Буцаах утга: { ok: true, value } эсвэл { ok: false, errors }; errors нь { [field]: 'REQUIRED' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_FORMAT' | 'DOMAIN_NOT_ALLOWED' | 'UNKNOWN_FIELD' }.

Дүрэм:
1. displayName: trim хийсний дараа 2–80 тэмдэгт.
2. email: trim, жижиг үсэг болгоно; 254 хүртэл; зөв и-мэйл хэлбэр; домэйн нь getAllowedDomains()-ийн аль нэгтэй ЯГ тэнцүү (subdomain, төстэй домэйн хүлээн авахгүй).
3. studentCode: trim хийсний дараа /^[A-Z]\d{9}$/ (жишээ B232270021).
4. password: trim ХИЙХГҮЙ; 12–128 тэмдэгт.
5. Зөвхөн эдгээр 4 талбар; илүү талбар байвал UNKNOWN_FIELD.
6. Эхний алдаагаар зогсохгүй, бүх талбарын алдааг нэг дор буцаана.
7. input object биш эсвэл deps буруу бол TypeError шиднэ.
8. value-д normalize хийсэн утгыг буцаана; input объектыг өөрчлөхгүй.

Аюулгүй байдал: нууц үгийг errors-д болон log-д оруулахгүй.

Мөн node:test ба node:assert/strict ашигласан, Arrange-Act-Assert бүтэцтэй registrationValidation.test.js бичээрэй: хэвийн 2, хилийн 2 (жишээ нь нэрийн яг 2/80 урт, нууц үгийн 12/128), t.mock.fn()-ээр getAllowedDomains-ийг mock хийж нэг удаа дуудагдсаныг шалгах 1 тест. ESLint recommended-д нийцсэн, JSDoc-той байна.
```

### AI-ийн анхны хариу

Ажлын хавтас зөвхөн унших эрхтэй, команд ажиллуулах оролдлогыг орчин хориглосон тул хоёр файлын бүтэн агуулгыг доор өглөө. Тест болон ESLint-ийг энэ орчинд ажиллуулж баталгаажуулаагүй.

Дутуу талбар болон хоосон утгад `REQUIRED`, string биш утгад `INVALID_FORMAT` буцаана. Нэр, нууц үгийн уртыг Unicode кодын цэгээр тоолно. И-мэйлд цэгээр тусгаарласан ASCII локал хэсэг болон DNS хэлбэрийн домэйн ашиглана. Домэйны жагсаалтыг нэг дуудалтаар авч, нормчилсон и-мэйлийн домэйнтой яг тулгана.

### `registrationValidation.js`

```js
const FIELDS = ['displayName', 'email', 'studentCode', 'password'];
const STUDENT_CODE_PATTERN = /^[A-Z]\d{9}$/;
const EMAIL_LOCAL_PART_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

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
 * Checks the local part and DNS labels of a normalized email address.
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

    let normalized = field === 'password' ? rawValue : rawValue.trim();

    if (field === 'email') {
      normalized = normalized.toLowerCase();
    }

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
      const length = [...value[field]].length;

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
    } else if (!allowedDomains.includes(value.email.split('@')[1])) {
      errors.set('email', 'DOMAIN_NOT_ALLOWED');
    }
  }

  if (
    Object.hasOwn(value, 'studentCode') &&
    !STUDENT_CODE_PATTERN.test(value.studentCode)
  ) {
    errors.set('studentCode', 'INVALID_FORMAT');
  }

  if (errors.size > 0) {
    return { ok: false, errors: Object.fromEntries(errors) };
  }

  return { ok: true, value };
}
```

### `registrationValidation.test.js`

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateRegistration } from './registrationValidation.js';

const deps = { getAllowedDomains: () => ['university.edu'] };

const validInput = Object.freeze({
  displayName: 'Бат Эрдэнэ',
  email: 'student@university.edu',
  studentCode: 'B232270021',
  password: 'example password',
});

test('normalizes the registration and preserves password whitespace', () => {
  // Arrange
  const input = Object.freeze({
    displayName: '  Бат Эрдэнэ  ',
    email: '  STUDENT@University.EDU  ',
    studentCode: '  B232270021  ',
    password: '  example password  ',
  });

  // Act
  const result = validateRegistration(input, deps);

  // Assert
  assert.deepEqual(result, {
    ok: true,
    value: { ...validInput, password: '  example password  ' },
  });
  assert.notStrictEqual(result.value, input);
});

test('collects field errors and rejects a university subdomain', () => {
  // Arrange
  const input = {
    displayName: '   ',
    email: 'student@mail.university.edu',
    studentCode: 'b232270021',
    password: 'short',
    role: 'admin',
  };

  // Act
  const result = validateRegistration(input, deps);

  // Assert
  assert.deepEqual(result, {
    ok: false,
    errors: {
      displayName: 'REQUIRED',
      email: 'DOMAIN_NOT_ALLOWED',
      studentCode: 'INVALID_FORMAT',
      password: 'TOO_SHORT',
      role: 'UNKNOWN_FIELD',
    },
  });
});

test('accepts a 2-character name and a 12-character password', () => {
  // Arrange
  const input = {
    ...validInput,
    displayName: '  Ан  ',
    password: 'a'.repeat(12),
  };

  // Act
  const result = validateRegistration(input, deps);

  // Assert
  assert.deepEqual(result, {
    ok: true,
    value: { ...input, displayName: 'Ан' },
  });
});

test('accepts an 80-character name and a 128-character password', () => {
  // Arrange
  const input = {
    ...validInput,
    displayName: 'А'.repeat(80),
    password: 'a'.repeat(128),
  };

  // Act
  const result = validateRegistration(input, deps);

  // Assert
  assert.deepEqual(result, { ok: true, value: input });
});

test('calls the injected domain provider once and uses its result', (t) => {
  // Arrange
  const getAllowedDomains = t.mock.fn(() => ['school.edu', 'campus.edu']);
  const input = { ...validInput, email: 'student@campus.edu' };

  // Act
  const result = validateRegistration(input, { getAllowedDomains });

  // Assert
  assert.deepEqual(result, { ok: true, value: input });
  assert.equal(getAllowedDomains.mock.callCount(), 1);
});
```

Node.js 24 дээр хоёр файлыг нэг хавтаст байрлуулаад `node --test registrationValidation.test.js` командаар ажиллуулна. Хэрэв төслийн `package.json` модуль төрлийг заадаг бол эдгээр `.js` файлын хувьд `"type": "module"` байна.

## 3. Prompt харьцуулалт

| Шалгуур | Тодорхойгүй prompt | Тодорхой prompt |
| --- | --- | --- |
| Технологи, интерфейс | JavaScript гэж таамагласан. ESM export байхгүй, `name` болон `confirmPassword` гэж сонгосон. | Dependency-гүй Node.js ESM, `validateRegistration(input, deps)` болон `ok/value/errors` гэрээтэй. |
| Хамрах дүрэм | Нэр, энгийн и-мэйл, 8 тэмдэгтийн нууц үг ба давталт. Оюутны код, домэйны жагсаалт, дээд хязгаар дутуу. | Дөрвөн талбар, уртын хязгаар, оюутны код, exact domain, илүү талбар, normalize, нэг дор алдаа цуглуулах логиктой. |
| Аюулгүй байдал, найдвартай байдал | String гэж таамагласан тул дутуу утгад `trim()` эсвэл `length` дээр алдаа гарна. | Оролт болон provider-ийн үр дүн шалгана. Input-ийг өөрчлөхгүй, алдаанд зөвхөн код өгнө. И-мэйлийн normalize дарааллыг review-ээр зассан. |
| Тест, ашиглах боломж | Тест өгөөгүй. | AAA бүтэц, mock бүхий 5 тест өгсөн. Анхны код дээр 5/5 давсан. |

## 4. Review

Production-ийн `registerSchema` болон `isUniversityEmail`-тай урт, хэлбэр, домэйн тулгалтыг харьцуулсан. AI хувилбарын ESM экспорт, JSDoc, exact domain, `TypeError`, илүү талбарын шалгалт, өөрчлөгдөөгүй input, олон алдаа нэгтгэх болон нууц үгийн зайг хадгалах логик ажилласан. Амжилтын `value.password` нь гэрээний дагуу хэвээр үлдэнэ. Алдааны объект зөвхөн код агуулна.

| № | Байршил ба олдсон асуудал | Нөлөө ба засвар |
| --- | --- | --- |
| 1 | Модуль, нэр ба нууц үгийн урт. Spread нь Unicode code point тоолж байсан. | Production гэрээний JavaScript `.length`-ээс зөрж байв. Нэр ба нууц үгийн UTF-16 уртыг `.length`-ээр шалгаж, emoji орсон доод ба дээд хилийг тестэлсэн. |
| 2 | Модуль, и-мэйл. ASCII хэлбэрийг шалгахаас өмнө `toLowerCase()` дуудаж байсан. | Зарим Unicode тэмдэгт жижиг үсэг болгоход ASCII болж, хэлбэрийн шалгалт давж байв. Trim хийсэн эх утгыг ASCII хэлбэрээр эхлээд шалгаад, дараа нь жижиг үсэг болгож домэйн тулгасан. |
| 3 | Анхны таван тест. Зөвшөөрөгдөх 2/80 ба 12/128 хилийг шалгасан ч яг гаднах утга, 254/255 и-мэйл, буруу dependency-ийн тохиолдол дутуу. | Хязгаарын гаднах оролт, нийлмэл алдаа, объектын өөрийн талбар, exact domain ба буруу provider-ийг хамарсан 13 тестээр баталгаажуулсан. |

Анхны кодыг түр хавтаст салгаж, анхны 5 тест болон эцсийн 13 тестийг тус тус ажиллуулсан. Эцсийн тестийг анхны код дээр ажиллуулахад гарсан TAP гаралтаас:

```text
not ok 5 - matches the production string lengths for supplementary Unicode characters
not ok 6 - validates the ASCII email syntax before case normalization
# tests 13
# pass 11
# fail 2
```

## 5. Эцсийн хувилбар ба ашиглалтын ил тод байдал

Codex CLI хоёр анхны хариуг гаргасан. Энэ ажлын Codex session хариуг харьцуулж review хийсэн, хоёр логикийн засварыг хэрэгжүүлсэн, эцсийн 13 тест, нотолгоо болон тайланг бэлтгэсэн. Хүний бие даасан review хийсэн гэж тэмдэглээгүй.

- [Эцсийн модуль](registrationValidation.js)
- [Эцсийн тест](registrationValidation.test.js)
- `npm --prefix labs/lab13 test`: шинэ 13/13, Нармандахын 9/9, нийт 22/22.
- `npx --no-install eslint labs/lab13 --max-warnings=0`: exit 0.
