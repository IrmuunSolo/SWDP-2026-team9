# Лаборатори 11 — Автомат тест бичих, CI Pipeline-д холбох

**Баг:** 9 · **Төсөл:** CampusFind / SWDP-2026-team9
**Огноо:** 2026-11-26 – [дууссан] · **Дараалал:** Г.Нармандах → Л.Ирмүүн → Э.Амарболд
**Тестийн сан:** `node:test` + `node:assert/strict` (Node 24)

## Зорилго

AAA (Arrange → Act → Assert) зарчмаар unit тест бичих, mock ашиглан гадаад хамаарлыг тусгаарлах, тестийг CI-д нэгтгэх. Бүх тест CampusFind-ийн үндсэн кодыг (`backend/`, `frontend/`, `packages/contracts/`) шууд шалгана. Тусдаа жишээ код ашиглахгүй.

Гарын авлага Jest-ийг жишээ болгосон ч «эсвэл» гэсэн сонголт өгсөн. Төсөл аль хэдийн `node:test` ашигладаг тул хоёр тестийн сан холихгүйн тулд түүнийг үргэлжлүүлэв. `t.mock.fn()` нь `jest.fn()`-тэй ижил үүрэгтэй.

## Г.Нармандах — `AuthService.login` (backend) — Хийгдсэн

**Branch:** `lab11/narmandakh-auth-tests` · **Суурь:** main `53756f7` · **Reviewer:** Л.Ирмүүн
**Файл:** `backend/test/unit/auth-login.test.ts`

### Яагаад энэ функц

`AuthService.login` нь нэвтрэлт ба 5 буруу оролдлогын дараах 10 минутын түгжээг (US-02) хариуцдаг аюулгүй байдлын гол урсгал. Өмнө нь зөвхөн PostgreSQL шаарддаг integration тестээр хамрагдаж байсан. Өгөгдлийн сангүйгээр хурдан ажиллах unit тест байгаагүй.

### Mock

`DbService` (Prisma)-ийг `t.mock.fn()`-ээр бүтээсэн хуурамч объектоор (`user.findUnique`, `user.update`, `session.create`, `$transaction`) орлуулж, `new AuthService(db, mail)` гэж шууд үүсгэсэн. Mock нь Prisma-гийн `{ increment: 1 }`-ийг дуурайж, update хийсний дараах мөрийг буцаадаг. Ингэснээр тест бүр DB-д ямар өгөгдөл бичих гэж байгааг (`mock.calls`) болон огт бичээгүйг (`mock.callCount() === 0`) шалгана. Нууц үгийн hash-ийг production-ий `hashPassword()`-оор үүсгэсэн.

### Тестүүд

| № | Тест | Төрөл | Assert |
| --- | --- | --- | --- |
| 1 | Зөв нууц үг → token, нийтийн хэрэглэгч | Хэвийн | 64 тэмдэгт hex token, 7 хоногийн хугацаа, `studentCodeMasked`, `passwordHash` ороогүй; тоолуур 0 болсон; session-д token-ий hash хадгалагдсан |
| 2 | Буруу нууц үг (1 дэх) | Хэвийн | 401 `INVALID_CREDENTIALS`, `failedAttempts: { increment: 1 }`, session үүсээгүй |
| 3 | 5 дахь буруу оролдлого | Хил | 429 `LOGIN_LOCKED`, `lockedUntil` = одоо + 10 минут |
| 4 | Бүртгэлгүй и-мэйл | Хил | Буруу нууц үгийнхтэй яг ижил status ба хариу (account enumeration-гүй), DB-д бичээгүй |
| 5 | Түгжигдсэн хэрэглэгч зөв нууц үгтэй | Mock | 429; `user.update`, `session.create`, `$transaction` нэг ч удаа дуудагдаагүй |
| 6 | Түгжээ дууссаны дараах буруу оролдлого | Хил | Тоолуур 1-ээс эхэлж, `lockedUntil: null` |
| 7 | И-мэйл normalize, баталгаажаагүй бүртгэл | Mock | `findUnique` `student@example.edu`-ээр дуудагдсан; 403 `ACCOUNT_UNAVAILABLE` |

Шаардлага (хэвийн 2, хил 2, mock 1)-аас илүү 7 тест бичсэн.

### Тест алдаа барьж чадаж байгаа эсэх

Тест үргэлж ногоон гарвал ашиггүй. Иймд production кодыг түр эвдэж (mutation), тест унаж байгааг шалгаад кодыг буцаасан:

| Эвдсэн өөрчлөлт | Унасан тест |
| --- | --- |
| Түгжих хугацаа 10 → 1 минут | 3 |
| Түгжих босго 5 → 6 | 3 |
| Түгжээний шалгалтыг алгассан | 5 |

[Mutation шалгалтын гаралт](../lab11/narmandakh-mutation-check.txt)

### Үр дүн

| Шалгалт | Үр дүн |
| --- | --- |
| `npm test -w @campusfind/api` | 32/32 (өмнө 25, +7) |
| `npx eslint backend --max-warnings=0` | exit 0 |
| `npm run check` | PASS |

[Тестийн гаралт](../lab11/narmandakh-tests.txt). Шинэ файл `npm test`-ийн `dist/test/unit/*.test.js` хэв маягт автоматаар орсон тул `foundation.yml`-ийн «Unit and HTTP tests» алхам PR бүрд ажиллуулна. Production кодыг өөрчлөөгүй.

## Л.Ирмүүн — `postUi.ts` (frontend)

Төлөв: Хүлээгдэж байна

## Э.Амарболд — Contracts схем, CI нэгтгэл, санаатай унагах

Төлөв: Хүлээгдэж байна

## Тестийн тоо

| Хүрээ | Өмнө | Дараа |
| --- | --- | --- |
| API unit | 25 | 32 (Нармандах +7) |
| Frontend | 4 | [Ирмүүн] |
| Contracts | 0 | [Амарболд] |
| Лаб 7 | 15 | 15 |

## CI

![CI амжилттай](../lab11/01-ci-success.png)
![Санаатай унасан CI](../lab11/02-ci-failed.png)

## Нийт дүгнэлт

[Сүүлийн ээлжид бөглөнө]
