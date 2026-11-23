# Баг 9 — Лаборатори 11: Автомат тест бичих, CI Pipeline-д холбох

**Гарын авлага:** Лаборатори 10 (11-р долоо хоног, Лекц 11) · CLO4 · 2 цаг
**Дараалал:** Г.Нармандах → Л.Ирмүүн → Э.Амарболд
**Branch:** `lab11/narmandakh-auth-tests` → `lab11/irmuun-postui-tests` → `lab11/amarbold-contract-tests-ci`
**Нотолгоо:** `labs/lab11/` · **Тайлан:** `labs/docx/Lab11_report_team9.md`

## 1. Зорилго ба deliverable

AAA (Arrange → Act → Assert) зарчмаар unit тест бичих, mock ашиглан гадаад хамаарлыг тусгаарлах, тестийг CI pipeline-д нэгтгэж санаатай алдаагаар CI улайхыг ажиглах.

**Гишүүн бүр:** өөрийн сонгосон функцэд **5 тест** бичнэ: хэвийн 2, хилийн (edge) 2, mock ашигласан 1.
**Багшид өгөх:** тестийн файлууд + CI амжилттай ажилласан screenshot (+ санаатай унагасан run-ийн screenshot).

**Тестийн сан:** гарын авлага Jest-ийг жишээ болгосон ч «эсвэл» гэж сонголт өгсөн. Төсөл аль хэдийн Node-ийн built-in `node:test` + `node:assert/strict`-ийг (API 25 тест, Лаб 7 15 тест, frontend тест) ашигладаг. Нэг төсөлд хоёр тестийн сан холихгүйн тулд `node:test`-ийг үргэлжлүүлнэ. `t.mock.fn()` нь Jest-ийн `jest.fn()`-тэй ижил үүрэгтэй.

## 2. Хуваарилалт

| Ээлж | Гишүүн | Тестлэх хэсэг | Файл | Reviewer |
| --- | --- | --- | --- | --- |
| 1 | Г.Нармандах | `AuthService.login` — нэвтрэлт ба 5 оролдлогын түгжээ (backend) | `backend/test/unit/auth-login.test.ts` | Л.Ирмүүн |
| 2 | Л.Ирмүүн | `postUi.ts` — `postError`, `readQuery`/`queryParams`, `validatePost` (frontend) | `frontend/test/postUi.test.mjs` | Э.Амарболд |
| 3 | Э.Амарболд | `registerSchema`, `createPostSchema` (contracts) + CI нэгтгэл + санаатай унагах | `packages/contracts/test/schemas.test.mjs`, `.github/workflows/foundation.yml` | Г.Нармандах |

Production кодын зан төлөвийг өөрчлөхгүй. Тест алдаа илрүүлбэл кодыг тусдаа commit-оор засаж, тайланд тайлбарлана.

## 3. Нийтлэг бэлтгэл (гишүүн бүр)

```
git switch main
git pull --ff-only origin main
npm ci
npm run db:generate
npm test
npm run test -w @campusfind/web
```

Эхлэхээс өмнө байгаа тестүүд бүгд ногоон байх ёстой. Гаралтын төгсгөлийг `labs/lab11/<нэр>-before.txt`-д хадгална.

Тест бүрийг ингэж бичнэ:

```ts
test('5 дахь буруу оролдлого түгжинэ', async (t) => {
  // Arrange — өгөгдөл, mock бэлдэх
  // Act — тестлэх функцийг нэг удаа дуудах
  // Assert — үр дүн, mock-ийн дуудлагыг шалгах
});
```

## 4. 1-р ээлж — Г.Нармандах: `AuthService.login`

**Яагаад:** Нэвтрэлт ба түгжээ нь аюулгүй байдлын гол урсгал. Integration тест (PostgreSQL) бүтэн урсгалыг шалгадаг ч өгөгдлийн сангүйгээр, хурдан ажиллах unit тест байхгүй.

**Mock:** `DbService`-ийг `t.mock.fn()`-ээр бүтээсэн хуурамч объектоор орлуулна (`user.findUnique`, `user.update`, `session.create`, `$transaction`). `new AuthService(db as unknown as DbService, mail as unknown as MailService)` гэж шууд үүсгэнэ. `any` ашиглахгүй (Лаб 12-ын ESLint дүрэм).

| № | Тест | Төрөл |
| --- | --- | --- |
| 1 | Зөв нууц үг → token, `user` буцаана; `failedAttempts: 0` болгож session үүсгэнэ | Хэвийн |
| 2 | Буруу нууц үг (1 дэх) → 401 `INVALID_CREDENTIALS`; `failedAttempts` нэмэгдэнэ | Хэвийн |
| 3 | 5 дахь буруу оролдлого → 429 `LOGIN_LOCKED`; `lockedUntil` ≈ одоо + 10 минут | Хил |
| 4 | Байхгүй и-мэйл → 401 бөгөөд мессеж нь буруу нууц үгийнхтэй **ижил** (account enumeration-гүй) | Хил |
| 5 | Түгжигдсэн хэрэглэгч зөв нууц үгтэй ч 429; `user.update`, `session.create` **дуудагдаагүй** (`mock.callCount() === 0`) | Mock |

Хэрэглэгчийн `passwordHash`-ийг `hashPassword()` (`backend/src/common/security.ts`)-ээр Arrange хэсэгт үүсгэнэ.

```
git switch -c lab11/narmandakh-auth-tests
npm test -w @campusfind/api
npx --no-install eslint backend --max-warnings=0
npm run check
```

Шинэ тест `npm test`-ийн `dist/test/unit/*.test.js` хэв маягт автоматаар орно. Гаралтыг `labs/lab11/narmandakh-after.txt`-д хадгална. `labs/docx/Lab11_report_team9.md`-ийг 9-р хэсгийн загвараар үүсгэж өөрийн хэсгийг бөглөнө. PR reviewer: Л.Ирмүүн.

## 5. 2-р ээлж — Л.Ирмүүн: frontend `postUi.ts`

**Яагаад:** `postUi.ts` нь зарлалын форм, хайлтын URL, API алдааны мессежийг хариуцдаг. `frontend/test/posts.test.mjs` зураг ба transport-ийг шалгадаг ч алдааны мессеж, query-ийн хил хамрагдаагүй.

**Mock:** `postError`-д `ApiError`-ийг status бүрээр үүсгэх, эсвэл `validatePost`-ийн «ирээдүйн огноо» шалгалтад `localToday`-д тогтмол огноо өгөх. Хамгийн багадаа нэг тест `t.mock.fn()` эсвэл `t.mock.timers`-ийг ашиглана.

| № | Тест | Төрөл |
| --- | --- | --- |
| 1 | `postError(new ApiError(401, …))` → нэвтрэлтийн мессеж | Хэвийн |
| 2 | `queryParams` default утгуудыг (`page: 1`, `pageSize: 20`, хоосон string) хасна | Хэвийн |
| 3 | `readQuery` хоосон зайтай болон үл мэдэгдэх параметрийг хаяна | Хил |
| 4 | `validatePost` маргаашийн огноотой зарлалыг `occurredOn` алдаатай буцаана, өнөөдрийнхийг хүлээн авна | Хил |
| 5 | `t.mock.timers` (эсвэл mock) ашиглан огноог тогтоож 4-р тестийг цагаас хамааралгүй болгох | Mock |

Шинэ файл `frontend/test/postUi.test.mjs` нь `posts.test.mjs`-ийн TypeScript transpile хийдэг эхний хэсгийг ашиглана. Frontend-ийн `test` script одоо зөвхөн `test/posts.test.mjs`-ийг ажиллуулдаг тул `frontend/package.json`-д шинэ файлыг нэмнэ:

```json
"test": "node --test test/posts.test.mjs test/postUi.test.mjs"
```

```
git switch -c lab11/irmuun-postui-tests
npm run test -w @campusfind/web
npx --no-install eslint frontend --max-warnings=0
npm run check
```

Тайлангийн өөрийн хэсгийг бөглөж PR нээнэ. Reviewer: Э.Амарболд.

## 6. 3-р ээлж — Э.Амарболд: contracts тест, CI нэгтгэл, санаатай унагах

### 6.1. Contracts схемийн тест

**Яагаад:** `packages/contracts` нь frontend, backend хоёулаа ашигладаг validation-ий цорын ганц эх сурвалж боловч өөрийн тестгүй.

| № | Тест | Төрөл |
| --- | --- | --- |
| 1 | Зөв бүртгэлийн өгөгдлийг `registerSchema` хүлээн авна | Хэвийн |
| 2 | `createPostSchema` LOST зарлалыг хүлээн авна | Хэвийн |
| 3 | Нууц үг 11 / 12 / 128 / 129 тэмдэгтийн хил | Хил |
| 4 | Оюутны код `b232270021` (жижиг үсэг), `B23227002` (8 орон) татгалзагдана; илүү талбар (`.strict()`) татгалзагдана | Хил |
| 5 | Mock: `t.mock.method(schema, 'safeParse')` ашиглан consumer функц схемийг нэг удаа дуудаж байгааг шалгах (жишээ нь backend-ийн `parse()` эсвэл frontend-ийн `validatePost`) | Mock |

`packages/contracts/package.json`-д `"test": "npm run build && node --test test/*.test.mjs"` нэмнэ.

### 6.2. CI-д нэгтгэх

`.github/workflows/foundation.yml`-ийн «Unit and HTTP tests including Lab 7» алхмын дараа нэмнэ:

```yaml
      - name: Frontend unit and transport tests
        run: npm run test -w @campusfind/web
      - name: Contract schema tests
        run: npm run test -w @campusfind/contracts
```

Ингэснээр гурван гишүүний тест бүгд push болон PR бүрд ажиллана. `continue-on-error`, `|| true` ашиглахгүй.

### 6.3. Санаатай унагах (гарын авлагын 8-р алхам)

1. Өөрийн branch дээр нэг тестийн хүлээлтийг санаатайгаар буруу болгож (жишээ нь хүлээх status-ийг 401 → 200) commit, push хийнэ.
2. PR-ийн Checks дээр Foundation улаан болж, яг аль тест унасныг log-оос харна. **`labs/lab11/02-ci-failed.png`** авна.
3. Хүлээлтийг буцааж засаад push хийнэ. Ногоон болсон run-ийн **`labs/lab11/01-ci-success.png`** авна.
4. Хоёр run-ийн URL болон commit SHA-г тайланд бичнэ. Санаатай алдаатай commit-ийг squash merge-ээр main-д оруулахгүй.

### 6.4. Тайлангийн нийт дүгнэлт

Нийт тестийн тоо (өмнө / дараа), mock-ийн хэрэглээ, CI-ийн өөрчлөлт, санаатай алдааны ажиглалт, дуусах огноог бичнэ. PR reviewer: Г.Нармандах.

## 7. Шалгах хуудас

- [ ] Гурван гишүүн тус бүр 5 тест (хэвийн 2, хил 2, mock 1), AAA бүтэцтэй
- [ ] `npm test`, frontend тест, contracts тест бүгд ногоон
- [ ] Шинэ тестүүд ESLint-д 0 алдаатай, `any` ашиглаагүй
- [ ] `foundation.yml` frontend, contracts тестийг ажиллуулдаг болсон
- [ ] CI амжилттай (`01-ci-success.png`) ба санаатай унасан (`02-ci-failed.png`) screenshot
- [ ] Тайлан гурван хэсэг, нийт дүгнэлттэй
- [ ] PR бүр өөр гишүүний review-тай

## 8. Тайлангийн загвар (`labs/docx/Lab11_report_team9.md`)

```markdown
# Лаборатори 11 — Автомат тест бичих, CI Pipeline-д холбох

**Баг:** 9 · **Төсөл:** CampusFind / SWDP-2026-team9
**Огноо:** [эхэлсэн] – [дууссан] · **Дараалал:** Г.Нармандах → Л.Ирмүүн → Э.Амарболд
**Тестийн сан:** node:test + node:assert/strict (Node 24)

## Зорилго
AAA зарчмаар unit тест бичих, mock ашиглан гадаад хамаарлыг тусгаарлах, тестийг CI-д нэгтгэх.

## Г.Нармандах — `AuthService.login` (backend)
Төлөв: Хүлээгдэж байна
| № | Тест | Төрөл | Arrange / Act / Assert товч | Үр дүн |

## Л.Ирмүүн — `postUi.ts` (frontend)
Төлөв: Хүлээгдэж байна

## Э.Амарболд — Contracts схем, CI нэгтгэл
Төлөв: Хүлээгдэж байна

## Тестийн тоо
| Хүрээ | Өмнө | Дараа |
| --- | --- | --- |
| API unit | 25 | [ ] |
| Frontend | 4 | [ ] |
| Contracts | 0 | [ ] |
| Лаб 7 | 15 | 15 |

## CI
![CI амжилттай](../lab11/01-ci-success.png)
![Санаатай унасан CI](../lab11/02-ci-failed.png)

## Нийт дүгнэлт
[Сүүлийн ээлжид бөглөнө]
```
