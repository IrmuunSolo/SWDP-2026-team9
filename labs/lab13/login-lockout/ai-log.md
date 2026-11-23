# AI ашиглалтын тэмдэглэл — `attemptLogin` (нэвтрэлтийн түгжих бодлого)

**Гишүүн:** Г.Нармандах · **Хэрэгсэл:** ChatGPT · **Огноо:** 2026-11-23, ~23:50 (UTC+8)
**Story:** US-02 — 5 удаа дараалан буруу оролдвол 10 минут түгжинэ.

Хоёр prompt-ийг тус тусад нь, өмнөх түүхгүй шинэ session-д өгсөн. AI-ийн хариуг доор өөрчлөлтгүй хадгалав. AI-ийн анхны кодыг `.js` файлаар хадгалаагүй (засаагүй кодыг root ESLint шалгахаас сэргийлсэн). Эцсийн, засварласан код: `loginLockout.js`, тест: `loginLockout.test.js`.

## 1. Тодорхойгүй prompt

```text
Login хийхэд олон удаа буруу оролдвол түгждэг функц бичээд өгөөч
```

### AI-ийн хариу (өөрчлөлтгүй)

````text
Доорх жишээг NestJS + TypeScript + Prisma ашиглан бичье. Login хийхэд хэрэглэгч 5 удаа дараалан буруу нууц үг оруулбал тухайн account-ийг 10 минут түгждэг байдлаар хэрэгжүүлье.
1. Database model
User model дээр дараах хоёр талбарыг нэмнэ.
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  password          String

  failedAttempts    Int       @default(0)
  lockedUntil       DateTime?
}


- failedAttempts: буруу нэвтрэх оролдлогын тоо.
- lockedUntil: account түгжигдэх хугацаа.
2. AuthService – Login function
auth.service.ts

async login(email: string, password: string) {
  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  // 1. User олдоогүй
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const now = new Date();

  // 2. Account түгжигдсэн эсэх
  if (user.lockedUntil && user.lockedUntil > now) {
    const remainingSeconds = Math.ceil(
      (user.lockedUntil.getTime() - now.getTime()) / 1000,
    );

    throw new UnauthorizedException(
      `Account locked. Try again in ${remainingSeconds} seconds.`,
    );
  }

  // 3. Хугацаа нь дууссан lock-ийг цэвэрлэх
  if (user.lockedUntil && user.lockedUntil <= now) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    user.failedAttempts = 0;
    user.lockedUntil = null;
  }

  // 4. Password шалгах
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password,
  );

  if (!isPasswordValid) {
    const attempts = user.failedAttempts + 1;

    // 5. 5 удаа буруу оролдсон бол түгжих
    if (attempts >= 5) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      throw new UnauthorizedException(
        'Too many failed attempts. Account locked for 10 minutes.',
      );
    }

    // 6. Алдаатай оролдлогын тоог нэмэх
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: attempts,
      },
    });

    throw new UnauthorizedException(
      `Invalid password. ${5 - attempts} attempts remaining.`,
    );
  }

  // 7. Амжилттай login хийсэн бол counter reset
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
    },
  });

  // 8. JWT үүсгэх эсвэл session үүсгэх
  return {
    message: 'Login successful',
    userId: user.id,
  };
}



3. Алгоритм хэрхэн ажиллах вэ?
User Login

Email + Password


Account locked?

lockedUntil > current time

Yes
Login reject


No
Check password




Incorrect
failedAttempts + 1

5 хүрвэл 10 минут lock


Correct
Reset counter

JWT / Session үүсгэх




4. Тестлэх жишээ
Оролдлого	Үр дүн
1 дэх удаа буруу	4 оролдлого үлдэнэ
2 дахь удаа буруу	3 оролдлого үлдэнэ
3 дахь удаа буруу	2 оролдлого үлдэнэ
4 дэх удаа буруу	1 оролдлого үлдэнэ
5 дахь удаа буруу	10 минут түгжинэ
10 минутын дараа	Counter reset
Зөв password	Login амжилттай, counter reset

5. Production дээр анхаарах зүйлс
Энэ бол үндсэн логик. Бодит системд дараах зүйлсийг анхаараарай:
1. Race condition: Олон login хүсэлт зэрэг ирвэл failedAttempts буруу тоологдож болно. Atomic database update эсвэл transaction ашиглах хэрэгтэй.
2. Account enumeration: Email олдоогүй болон password буруу үед ижил ерөнхий алдааны мэдээлэл буцаах хэрэгтэй.
3. Rate limiting: IP хаяг болон account-аар давхар хязгаарлалт тавих хэрэгтэй.
4. Password hashing: Password-ийг bcrypt эсвэл Argon2 ашиглан hash хийж хадгална.
5. Distributed system: Олон сервертэй үед Redis ашиглан rate limit хийх боломжтой.
Нэг чухал зүйл: Account lockout болон rate limiting хоёр өөр хамгаалалт. Account lockout нь хэрэглэгчийн бүртгэлийг, rate limiting нь хүсэлтийн давтамжийг хязгаарладаг.

Хэрэв хүсвэл дараагийн алхамд үүнийг NestJS + Prisma + PostgreSQL + Redis ашигласан бүрэн production-oriented AuthService болгон хөгжүүлж болно.
````

## 2. Тодорхой prompt

```text
Node.js 24, ESM (export), гадны dependency-гүй, JavaScript (TypeScript биш) дээр loginLockout.js модуль бичээрэй.

Зорилго: их сургуулийн гээгдэл эд зүйлийн веб системд нэвтрэх оролдлогыг хязгаарлах бодлогын цэвэр логик. HTTP, өгөгдлийн сан хамаарахгүй.

Функц: export async function attemptLogin(state, password, deps)
- state: { failedAttempts: number, lockedUntil: number | null } — lockedUntil нь Unix ms.
- deps: { verifyPassword: async (password) => boolean, now: () => number } — цаг ба нууц үг шалгагчийг гаднаас өгнө (тестэд mock хийхийн тулд). Функц дотор Date.now() дуудахгүй.
- Буцаах утга: { result, state, retryAfterMs?, remainingAttempts? }; result нь 'OK' | 'INVALID' | 'LOCKED'.

Дүрэм:
1. Дараалсан 5 буруу оролдлогын дараа 10 минут (600000 ms) түгжинэ. 5 дахь буруу оролдлого өөрөө түгжээг эхлүүлнэ.
2. Түгжигдсэн үед (now < lockedUntil) нууц үг зөв байсан ч LOCKED буцаана, verifyPassword-ийг огт дуудахгүй, retryAfterMs буцаана.
3. now >= lockedUntil бол түгжээ дууссан: тоолуурыг 0 болгож, энэ оролдлогыг шинээр үнэлнэ.
4. Зөв нууц үг тоолуурыг 0, lockedUntil-ийг null болгоно.
5. Оролтын state объектыг өөрчлөхгүй (immutable), шинэ state буцаана.
6. Буруу оролт (сөрөг/бутархай failedAttempts, тоо биш lockedUntil, deps функц биш) бол TypeError шиднэ.
7. Тогтмолуудыг MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS нэрээр export хийнэ.

Аюулгүй байдал: нууц үгийг log хийх, буцаах утгад оруулахгүй.

Мөн node:test ба node:assert/strict ашигласан, Arrange-Act-Assert бүтэцтэй loginLockout.test.js бичээрэй: хэвийн 2, хилийн 2 (5 дахь оролдлого, яг lockedUntil агшин), t.mock.fn()-ээр verifyPassword-ийг mock хийж түгжигдсэн үед дуудагдаагүйг шалгах 1 тест. Код ESLint recommended-д нийцсэн, JSDoc-той байна.
```

### AI-ийн хариу (өөрчлөлтгүй)

````text
Доорх шийдэл нь **Node.js 24 + ESM + цэвэр JavaScript** ашиглана. Гаднын dependency байхгүй бөгөөд `node:test`, `node:assert/strict`-ээр тестлэнэ.

Бүтэц:

```
login-lockout/
├── package.json
├── loginLockout.js
└── loginLockout.test.js
```

## **1.&#x20;**`loginLockout.js`

```

/**
 * Maximum number of consecutive failed login attempts.
 * @type {number}
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * Lock duration in milliseconds (10 minutes).
 * @type {number}
 */
export const LOCK_DURATION_MS = 10 * 60 * 1000;

/**
 * Attempts to authenticate a user while enforcing login lockout rules.
 *
 * The function does not mutate the input state.
 * Passwords are never logged or included in the returned value.
 *
 * @param {{ failedAttempts: number, lockedUntil: number | null }} state
 * @param {string} password
 * @param {{
 *   verifyPassword: (password: string) => Promise<boolean>,
 *   now: () => number
 * }} deps
 *
 * @returns {Promise<{
 *   result: 'OK' | 'INVALID' | 'LOCKED',
 *   state: { failedAttempts: number, lockedUntil: number | null },
 *   retryAfterMs?: number,
 *   remainingAttempts?: number
 * }>}
 *
 * @throws {TypeError} If the input arguments are invalid.
 */
export async function attemptLogin(state, password, deps) {
  // Validate state.
  if (
    state === null ||
    typeof state !== 'object' ||
    Array.isArray(state) ||
    !Number.isInteger(state.failedAttempts) ||
    state.failedAttempts < 0 ||
    (
      state.lockedUntil !== null &&
      (
        typeof state.lockedUntil !== 'number' ||
        !Number.isFinite(state.lockedUntil)
      )
    )
  ) {
    throw new TypeError('Invalid state');
  }

  // Validate dependencies.
  if (
    deps === null ||
    typeof deps !== 'object' ||
    typeof deps.verifyPassword !== 'function' ||
    typeof deps.now !== 'function'
  ) {
    throw new TypeError('Invalid dependencies');
  }

  if (typeof password !== 'string') {
    throw new TypeError('Password must be a string');
  }

  const currentTime = deps.now();

  if (!Number.isFinite(currentTime)) {
    throw new TypeError('now() must return a finite number');
  }

  let failedAttempts = state.failedAttempts;
  let lockedUntil = state.lockedUntil;

  // Check whether the account is currently locked.
  if (lockedUntil !== null && currentTime < lockedUntil) {
    return {
      result: 'LOCKED',
      state: {
        failedAttempts,
        lockedUntil
      },
      retryAfterMs: lockedUntil - currentTime
    };
  }

  // Reset the counter when the lock has expired.
  if (lockedUntil !== null && currentTime >= lockedUntil) {
    failedAttempts = 0;
    lockedUntil = null;
  }

  // Verify the supplied password.
  const isValid = await deps.verifyPassword(password);

  // Successful authentication.
  if (isValid) {
    return {
      result: 'OK',
      state: {
        failedAttempts: 0,
        lockedUntil: null
      },
      remainingAttempts: MAX_FAILED_ATTEMPTS
    };
  }

  // Failed authentication.
  failedAttempts += 1;

  // Lock the account after the fifth consecutive failure.
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = currentTime + LOCK_DURATION_MS;

    return {
      result: 'LOCKED',
      state: {
        failedAttempts,
        lockedUntil
      },
      retryAfterMs: LOCK_DURATION_MS
    };
  }

  return {
    result: 'INVALID',
    state: {
      failedAttempts,
      lockedUntil
    },
    remainingAttempts: MAX_FAILED_ATTEMPTS - failedAttempts
  };
}

```

## **2.&#x20;**`loginLockout.test.js`

Нийт 5 тест:

- Хэвийн: зөв нууц үг.
- Хэвийн: буруу нууц үг.
- Хилийн: тав дахь буруу оролдлого.
- Хилийн: яг `lockedUntil` агшин.
- Mock: түгжээтэй үед `verifyPassword` огт дуудагдахгүй.

```

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  attemptLogin,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS
} from './loginLockout.js';

const createDeps = (isPasswordValid, currentTime = 1000000) => ({
  verifyPassword: async () => isPasswordValid,
  now: () => currentTime
});

// 1. Normal: successful login resets the counter.
test('should reset failed attempts after successful login', async () => {
  // Arrange
  const state = {
    failedAttempts: 3,
    lockedUntil: null
  };

  const deps = createDeps(true);

  // Act
  const response = await attemptLogin(state, 'correct-password', deps);

  // Assert
  assert.equal(response.result, 'OK');
  assert.deepEqual(response.state, {
    failedAttempts: 0,
    lockedUntil: null
  });
  assert.equal(response.remainingAttempts, MAX_FAILED_ATTEMPTS);
  assert.deepEqual(state, {
    failedAttempts: 3,
    lockedUntil: null
  });
});

// 2. Normal: incorrect password increments the counter.
test('should increment failed attempts after incorrect password', async () => {
  // Arrange
  const state = {
    failedAttempts: 2,
    lockedUntil: null
  };

  const deps = createDeps(false);

  // Act
  const response = await attemptLogin(state, 'wrong-password', deps);

  // Assert
  assert.equal(response.result, 'INVALID');
  assert.deepEqual(response.state, {
    failedAttempts: 3,
    lockedUntil: null
  });
  assert.equal(response.remainingAttempts, 2);
});

// 3. Boundary: fifth incorrect attempt starts the lock.
test('should lock account after fifth failed attempt', async () => {
  // Arrange
  const currentTime = 1000000;

  const state = {
    failedAttempts: 4,
    lockedUntil: null
  };

  const deps = createDeps(false, currentTime);

  // Act
  const response = await attemptLogin(state, 'wrong-password', deps);

  // Assert
  assert.equal(response.result, 'LOCKED');
  assert.deepEqual(response.state, {
    failedAttempts: 5,
    lockedUntil: currentTime + LOCK_DURATION_MS
  });
  assert.equal(response.retryAfterMs, LOCK_DURATION_MS);
});

// 4. Boundary: attempt exactly at lockedUntil is allowed.
test('should allow login when current time equals lockedUntil', async () => {
  // Arrange
  const lockedUntil = 2000000;

  const state = {
    failedAttempts: 5,
    lockedUntil
  };

  const deps = createDeps(true, lockedUntil);

  // Act
  const response = await attemptLogin(state, 'correct-password', deps);

  // Assert
  assert.equal(response.result, 'OK');
  assert.deepEqual(response.state, {
    failedAttempts: 0,
    lockedUntil: null
  });
  assert.deepEqual(state, {
    failedAttempts: 5,
    lockedUntil
  });
});

// 5. Mock: verifyPassword must not execute while account is locked.
test('should not call verifyPassword while account is locked', async (t) => {
  // Arrange
  const currentTime = 1000000;
  const lockedUntil = currentTime + LOCK_DURATION_MS;

  const state = {
    failedAttempts: 5,
    lockedUntil
  };

  const verifyPassword = t.mock.fn(async () => true);

  const deps = {
    verifyPassword,
    now: () => currentTime
  };

  // Act
  const response = await attemptLogin(state, 'correct-password', deps);

  // Assert
  assert.equal(response.result, 'LOCKED');
  assert.equal(response.retryAfterMs, LOCK_DURATION_MS);
  assert.equal(verifyPassword.mock.callCount(), 0);
  assert.deepEqual(response.state, {
    failedAttempts: 5,
    lockedUntil
  });
});

```

## **3.&#x20;**`package.json`

ESM горим идэвхжүүлэхийн тулд `"type": "module"` шаардлагатай.

```

{
  "name": "login-lockout",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "engines": {
    "node": ">=24"
  }
}

```

## **4. Ажиллуулах**

```
# Node хувилбар шалгах
node -v

# Тест ажиллуулах
npm test
```

Эсвэл:

```
node --test loginLockout.test.js
```

## **5. Логикийн үр дүн**

**Login оролдлогын жишээ**

**1.**

**INVALID**

1 / 5

4 оролдлого үлдсэн

**2.**

**INVALID**

2 / 5

3 оролдлого үлдсэн

**3.**

**INVALID**

3 / 5

2 оролдлого үлдсэн

**4.**

**INVALID**

4 / 5

1 оролдлого үлдсэн

**5.**

**LOCKED**

5 / 5

10 минут түгжинэ

**Түгжээ дуусахад**

Шинээр эхэлнэ

Тоолуур 0 болж, тухайн оролдлогын нууц үгийг шалгана.

## **6. Анхаарах аюулгүй байдлын зүйлс**

Энэ модуль зөвхөн бизнес логик учраас production системд дараах зүйлсийг анхаараарай:

1. **Concurrency:** Нэг хэрэглэгч зэрэг олон login хүсэлт илгээвэл race condition үүсэж болно. Төлөвийн шинэчлэлтийг DB transaction эсвэл atomic operation ашиглан хамгаалах шаардлагатай.
2. **Distributed system:** Олон сервертэй үед `state`-г зөвхөн memory-д хадгалж болохгүй. Redis эсвэл өгөгдлийн санд хадгална.
3. **Account enumeration:** Хэрэглэгчийн бүртгэл байгаа эсэхийг ил гаргахгүй байх.
4. **Password hashing:** Нууц үгийг шалгахдаа Argon2id эсвэл bcrypt ашигласан verifier-ийг `verifyPassword`-д дамжуулна.

**Чухал:** Энэ модуль өөрөө төлөв хадгалахгүй. Дуудлага бүрт шинэ `state` буцаадаг тул буцаасан state-ийг дараагийн оролдлогод дамжуулах үүрэг нь дуудагч талд байна.

Таны шаардсан 5 тест тус бүр AAA бүтэцтэй, `Date.now()` ашиглаагүй, `t.mock.fn()`-ээр mock шалгалт хийсэн.
````

## 3. Харьцуулалт

| Шалгуур | Тодорхойгүй prompt | Тодорхой prompt |
| --- | --- | --- |
| Технологи | Өөрөө NestJS + TypeScript + Prisma + bcrypt гэж таамагласан. Prisma model-ийн `password` талбар манай `passwordHash`-тай таарахгүй. | Хүссэнээр Node 24, ESM, dependency-гүй JavaScript. |
| Ажиллах эсэх | Класс бүтэн биш хэсэг. `bcrypt`, `UnauthorizedException` import байхгүй тул шууд compile хийгдэхгүй. | Бүтэн модуль, шууд ажилласан. |
| Тестлэх боломж | `new Date()`, `Date.now()`, Prisma-г функц дотор шууд дуудсан тул өгөгдлийн сангүйгээр unit тест бичих боломжгүй. | Цаг ба нууц үг шалгагчийг `deps`-ээр гаднаас авдаг тул mock хийхэд хялбар. |
| Тест | Зөвхөн хүлээгдэх үр дүнгийн хүснэгт, тестийн код байхгүй. | 5 тест (`node:test`, AAA, `t.mock.fn()`), бүгд давсан. |
| Аюулгүй байдал | Хэрэглэгч олдоогүй үед «Invalid email or password», нууц үг буруу үед «Invalid password. N attempts remaining» гэж ялгаатай мессеж буцаадаг тул account байгаа эсэх задарна (account enumeration). Хачирхалтай нь өөрийн 5-р хэсэгт үүнээс сэргийлэхийг зөвлөсөн. Түгжээг 429 биш 401-ээр буцаасан. `user` объектыг шууд өөрчилдөг. Read → +1 → write нь atomic биш (өөрөө race condition гэж анхааруулсан). | Оролтыг шалгасан, state-ийг өөрчлөхгүй, түгжигдсэн үед нууц үг шалгахгүй. Гэхдээ review-д доорх 2 аюулгүй байдлын асуудал илэрсэн. |
| Хамрах хүрээ | Бодлого, DB, HTTP, JWT-ийг нэг функцэд хольсон. | Зөвхөн бодлогын цэвэр логик (хүссэнээр). |

**Дүгнэлт:** Тодорхойгүй prompt-д AI технологи, өгөгдлийн бүтэц, алдааны мессежийг өөрөө таамагласан. Үр дүнд нь манай төсөлд шууд ашиглах, тестлэх боломжгүй, account enumeration-тэй код гарсан. Тодорхой prompt-д технологи, функцийн гарын үсэг, 7 дүрэм, тестийн шаардлагыг заасан тул AI бүгдийг дагасан. Гэхдээ prompt-д заагаагүй хоёр аюулгүй байдлын нөхцөлийг (буцаах утгын төрөл, оролтын урт) өөрөө бодож тусгаагүй.

## 4. Review

Шалгасан зүйл (Лекц 13-ын шалгуур): 7 дүрэм бүрийг кодтой тулгасан, хилийн утгуудыг гараар ажиллуулж үзсэн, оролтын төрөл ба хэмжээг туршсан, AI-ийн тестүүдийг шаардлагатай тулгасан.

**Зөв байсан:** 5 дахь буруу оролдлого түгжинэ (`>=`); `now < lockedUntil` хил зөв (яг тэнцүү агшинд түгжээ дууссан); түгжигдсэн үед `verifyPassword` дуудахгүй; дууссан түгжээнд тоолуур 0-ээс эхэлнэ; state-ийг mutate хийхгүй; `Date.now()` ашиглаагүй; нууц үг буцаах утгад ороогүй; ESLint recommended-д 0 алдаатай.

| № | Байршил | Асуудал | Ач холбогдол | Засвар |
| --- | --- | --- | --- | --- |
| 1 | `if (isValid)` | `verifyPassword`-ийн үр дүнг truthy эсэхээр шалгадаг. `'false'`, `1`, `{}` зэрэг boolean биш утга буцаавал нэвтрэлт **амжилттай** болно (бодитоор туршиж батлав). | Аюулгүй байдал (fail open). Шалгагч алдаатай, эсвэл JSON-оос `"false"` string буцаавал нууц үггүй нэвтэрнэ. | Зөвхөн яг `true`-г амжилт гэж үзнэ. Boolean биш утгад `TypeError` шиднэ (fail closed). Тест 6. |
| 2 | `password` шалгалт | Зөвхөн `typeof` шалгадаг, урт хязгааргүй. 1,000,000 тэмдэгт нууц үг шууд hash шалгагч руу дамжсан. | Аюулгүй байдал (DoS). bcrypt/scrypt нь удаан hash тул урт оролтоор CPU ачаалж болно. Production-ийн `loginSchema` нууц үгийг 128-аар хязгаарладаг. | `MAX_PASSWORD_LENGTH = 128`. Үүнээс урт бол шалгагчийг дуудалгүй буруу оролдлого гэж тоолно. Тест 8. |
| 3 | `loginLockout.test.js` | AI-ийн 5 тест 7 дүрмээс 2-ыг шалгадаггүй: дууссан түгжээний дараах **буруу** нууц үг (дүрэм 3) болон `TypeError` (дүрэм 6). | Тестийн хамрах хүрээ. Логик зөв байсан ч ирээдүйн өөрчлөлтөд хамгаалалтгүй. | Тест 7, 9 нэмсэн. Хоёулаа AI-ийн кодон дээр ч давсан тул логикийн алдаа биш, зөвхөн хамрах хүрээний дутагдал. |

**Нотолгоо:** Эцсийн 9 тестийг AI-ийн анхны код дээр ажиллуулахад 7 давж, review-ийн №1 ба №2-т харгалзах 2 тест унасан:

```text
✖ should not log in when verifyPassword resolves a non-boolean value
✖ should not pass an over-long password to verifyPassword
ℹ tests 9
ℹ pass 7
ℹ fail 2
```

Засварласан код дээр 9/9 давсан.

## 5. Өөрийн хийсэн засвар

- `isValid` шалгалтыг `typeof isValid !== 'boolean'` → `TypeError`, `isValid === true` → OK болгосон.
- `MAX_PASSWORD_LENGTH` тогтмол ба урт шалгалт нэмсэн.
- Давхардсан буруу оролдлогын логикийг `registerFailure()` туслах функц болгож, хэт урт нууц үг ба буруу нууц үг нэг замаар явдаг болгосон.
- Оролтын шалгалтыг `assertState()`, `assertDeps()` болгож уншихад хялбарчилсан. Шалгах нөхцөл өөрчлөгдөөгүй.
- JSDoc-ийг Монгол болгож, `@typedef`-ээр давхардлыг багасгасан.
- AI-ийн 5 тестийн шалгалтыг өөрчлөөгүй (зөвхөн формат болон тайлбарыг Монгол болгосон), review-ийн дагуу 4 тест нэмсэн: нийт 9.
- AI-ийн хариунд байсан `package.json`-ийг ашиглаагүй. Багийн нийтлэг `labs/lab13/package.json` (Node `>=24 <25`) ашигласан.
