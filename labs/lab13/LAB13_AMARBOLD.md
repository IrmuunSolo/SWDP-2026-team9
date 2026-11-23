# Лаб 12 ба Лаб 13 — Э.Амарболдын үлдсэн ажил

Хоёр лабораторийн ажил үлдсэн. Лаб 12-ыг түрүүлж хийнэ. Лаб 13-ын ээлж Ирмүүний PR merge болсны дараа эхэлнэ.

| Дараалал | Ажил | Нөхцөл |
| --- | --- | --- |
| 1 | Лаб 12: PR #31-ийг review хийх | Одоо |
| 2 | Лаб 12: 3-р ээлж (database lint, audit, CI lint) | PR #31 merge болсны дараа |
| 3 | Лаб 13: Ирмүүний PR-ийг review хийх | Ирмүүн PR нээсний дараа |
| 4 | Лаб 13: 3-р ээлж (`verifySecretAnswer`, нийт дүгнэлт) | Ирмүүний PR merge болсны дараа |

---

## A. Лаб 12 — 3-р ээлж

Дэлгэрэнгүй алхам нь Лаб 12-ын заавар (`LAB12_TEAM9_GUIDE.md`)-ын 6-р хэсэгт бий. Энд Нармандахын ээлжийн дараах төлөвийг товч дурдав.

### A.1. PR #31-ийг review хийх

PR #31 (`lab12/narmandakh-static-fixes`) нь backend-ийн 4 `no-explicit-any` error-ыг засаж, root lint-ийг 0 error / 0 warning болгосон. Шалгах зүйлс:

- `backend/src/common/http.ts`: `parse()`-ийн төрөл `z.ZodType<T, z.ZodTypeDef, unknown>` болсон. Validation-ийн зан төлөв өөрчлөгдөөгүй эсэх.
- Хоёр тестийн файлд зөвхөн төрлийн тэмдэглэгээ өөрчлөгдсөн эсэх.
- CI: CampusFind checks ба Foundation (PostgreSQL integration) ногоон эсэх.

Approve өгсний дараа merge хийнэ.

### A.2. Нармандахаас хүлээж авах мэдээлэл

- **Database lint:** finding 0. Database-д засах lint үлдэгдэл байхгүй.
- **Audit (2026-11-23):** root 7 moderate, 7 high, critical 0. Ирмүүний handoff-оос хойш advisory database шинэчлэгдэж `prisma`, `@prisma/config`, `effect` нэмэгдсэн. Before-update scan-ийг өөрийн машин дээр дахин авна.
- **Backend нөлөөний шинжилгээ** (дэлгэрэнгүй нь Лаб 12-ын тайлангийн Нармандахын хэсэгт):

| Package | Санал |
| --- | --- |
| `@nestjs/platform-express` 11.2.7 → 11.2.11 | Patch/minor update. multer-ийн advisory-г засна. |
| `multer` 2.4.0 → 2.5.0 | platform-express-ийн update-ээр хамт. Одоогоор backend-д multer ашиглаагүй тул хүрэх зам байхгүй. |
| `body-parser` 2.3.0 → 2.4.0 | **Заавал шинэчлэх.** Nest-ийн JSON body parser бүх хүсэлтэд ажилладаг тул production-д хүрэх зам бий. |
| `zod` 3.25.76 → 4.6.7 | Major update. Contracts, `zod-to-json-schema`, generated docs, `parse()`-ийн `ZodTypeDef`-д нөлөөлнө. Blocker/mitigation/owner/хугацааг тайланд бичих нь зохимжтой. |
| `prisma`, `@prisma/config`, `effect` | Зөвхөн Prisma CLI-д хамаарна. npm-ийн санал болгосон 6.12.0 нь downgrade тул тохиромжгүй. |

### A.3. Хийх ажил

1. `main`-аа шинэчилж `lab12/amarbold-audit-ci` branch үүсгэнэ.
2. Database lint, нийт `npm run lint`-ийг ажиллуулж 0/0-г баталгаажуулна.
3. Before-update audit-ийг (root ба Лаб 7) JSON-оор хадгалж, Critical/High/Medium/Low-оор ангилна.
4. High-уудыг шинэчилнэ (`npm audit fix --force` ашиглахгүй). Шинэчлэх боломжгүй бол blocker/mitigation/owner/хугацааг бичнэ.
5. `.github/workflows/ci.yml`-д Лаб 7-ын Install ба Test алхмын хооронд root install болон `npm run lint` алхмыг `working-directory: .`-тайгаар нэмнэ.
6. After lint/audit нотолгоо, CI-ийн screenshot (`06-ci-lint-success.png`, `07-ci-foundation-success.png`)-ыг авна.
7. Тайлангийн өөрийн хэсэг, нийт хүснэгтүүдийг бөглөж PR нээнэ. Reviewer нь Г.Нармандах.

---

## B. Лаб 13 — 3-р ээлж (сүүлийн ээлж)

**Даалгавар:** `hashSecretAnswer` / `verifySecretAnswer` — нууц асуултын хариулт (US-08)
**Branch:** `lab13/amarbold-secret-answer`
**Хавтас:** `labs/lab13/secret-answer/`
**Reviewer:** Г.Нармандах
**Дэлгэрэнгүй дүрэм:** `LAB13_TEAM9_GUIDE.md`

Жишээ хавтас: `labs/lab13/login-lockout/` (Нармандах). Бүтэц, `ai-log.md`-ийн хэлбэр, тестийн хэв маягийг тэндээс загвар болгоно.

### B.1. Өмнөх ээлжийг хүлээж авах

1. Ирмүүний PR (`lab13/irmuun-registration-validation`)-ийг review хийж Approve өгнө: prompt/хариу бүтэн хадгалагдсан эсэх, review ба тест таарч байгаа эсэх, `npm --prefix labs/lab13 test` бүгд давж байгаа эсэх.
2. Merge болсны дараа ээлжээ эхэлнэ.

### B.2. Бэлтгэл

```bash
git switch main
git pull --ff-only origin main
git switch -c lab13/amarbold-secret-answer
mkdir -p labs/lab13/secret-answer
npm --prefix labs/lab13 test
```

Сүүлийн команд Нармандах, Ирмүүний тестүүдийг давуулах ёстой.

### B.3. AI-д prompt өгөх

Хоёр prompt-ийг **тус тусдаа, өмнөх түүхгүй шинэ session-д** өгнө. Хариуг **өөрчлөлтгүй, бүтнээр** `labs/lab13/secret-answer/ai-log.md`-д хадгална. Хэрэгслийн нэр, огноо, цагийг бичнэ.

**Prompt 1 — тодорхойгүй:**

```
Нууц асуултын хариуг шалгадаг функц бичээд өгөөч
```

**Prompt 2 — тодорхой:**

```
Node.js 24, ESM (export), зөвхөн node:crypto ашигласан, гадны dependency-гүй JavaScript дээр secretAnswer.js модуль бичээрэй. Их сургуулийн гээгдэл эд зүйлийн системд олдсон эд зүйлийн эзнийг нууц асуултын хариугаар шалгах цэвэр логик; HTTP, өгөгдлийн сан хамаарахгүй.

Функцүүд:
- export async function hashSecretAnswer(answer, deps) → string
- export async function verifySecretAnswer(answer, stored) → boolean
- deps: { randomBytes: (size) => Buffer } — salt үүсгэгчийг гаднаас өгнө (тестэд mock хийхийн тулд); өгөөгүй бол crypto.randomBytes.

Дүрэм:
1. Хариуг normalize хийнэ: Unicode NFKC, trim, дотрох олон хоосон зайг нэг болгох, жижиг үсэг (кирилл үсэг зөв ажиллах ёстой: "Хар Цүнх" ба "  хар   цүнх " ижил).
2. Normalize хийсний дараа 1–100 тэмдэгт; эс бол RangeError. answer string биш бол TypeError.
3. Hash: scrypt (N=16384, r=8, p=1, keylen=32), 16 байт санамсаргүй salt. Хадгалах формат: "scrypt$16384$8$1$<salt base64>$<hash base64>".
4. verifySecretAnswer нь crypto.timingSafeEqual ашиглаж харьцуулна.
5. stored формат буруу эсвэл параметр нь дэмжигдэхгүй бол алдаа шидэхгүй, false буцаана.
6. Нэг хариуг хоёр удаа hash хийхэд өөр үр дүн гарна (salt-аас болж).

Аюулгүй байдал: хариу болон hash-ийг log хийхгүй.

Мөн node:test ба node:assert/strict ашигласан, Arrange-Act-Assert бүтэцтэй secretAnswer.test.js бичээрэй: хэвийн 2 (зөв/буруу хариу), хилийн 2 (normalize, 1 ба 100 тэмдэгтийн хил), t.mock.fn()-ээр randomBytes-ийг mock хийж тогтмол salt ашиглагдсаныг шалгах 1 тест. ESLint recommended-д нийцсэн, JSDoc-той байна.
```

### B.4. Харьцуулалт ба review

`ai-log.md`-д хоёр хариуг харьцуулсан хүснэгт бичнэ: технологи, ажиллах эсэх, тестлэх боломж, тест, аюулгүй байдал, хамрах хүрээ.

Тодорхой prompt-ийн кодыг Лекц 13-ын шалгуураар review хийнэ. Хариулах асуултууд:

- Хариулт нь `===`-ээр биш, `timingSafeEqual`-аар харьцуулагдаж байна уу? Урт өөр buffer-т `timingSafeEqual` алдаа шиддэг тул тэр тохиолдлыг яаж шийдсэн бэ?
- Stored string-ийн параметрийг (N, r, p) шалгалгүйгээр шууд ашиглаж байна уу? Халдагч маш том N оруулбал юу болох вэ?
- Буруу форматтай stored (хоосон, `$` дутуу, base64 биш) үед алдаа шидэх үү, false буцаах уу?
- Normalize: кирилл үсэг, NFKC, давхар зай зөв үү? Нэг хариуны hash хоёр удаа өөр гарч байна уу?
- AI-ийн тестүүд хилийн тохиолдлыг үнэхээр шалгаж байна уу?

Олдсон 2–3 асуудлыг (эсвэл «асуудал олдоогүй, учир нь …» гэсэн үндэслэлийг) байршил, ач холбогдол, засвартай нь бичнэ. Хамгийн хүчтэй нотолгоо нь: эцсийн тестүүдийг AI-ийн анхны код дээр түр ажиллуулж, унасан тестийн гаралтыг `ai-log.md`-д хадгалах.

**Анхааруулга:** AI-ийн анхны кодыг `.js` файлаар repo-д хадгалахгүй. Зөвхөн `ai-log.md`-ийн code block-д байна.

### B.5. Эцсийн код ба тест

- `labs/lab13/secret-answer/secretAnswer.js`: review-ийн дагуу засварласан код.
- `labs/lab13/secret-answer/secretAnswer.test.js`: 5-аас доошгүй тест (хэвийн 2, хил 2, mock 1).

```bash
npm --prefix labs/lab13 test
npx --no-install eslint labs/lab13 --max-warnings=0
git diff --check
```

### B.6. Тайлан (сүүлийн ээлж)

`labs/docx/Lab13_report_team9.md`-д:

1. **«Э.Амарболд — Нууц хариулт»** хэсгийг Нармандахын хэсгийн бүтцээр бөглөнө.
2. Толгой хэсгийн **дуусах огноог** бичнэ.
3. **«Нийт дүгнэлт»**-ийг бичнэ: гурван функцэд тодорхой prompt юуг өөрчилсөн, AI-д нийтлэг ямар алдаа гарсан (жишээ нь prompt-д заагаагүй аюулгүй байдлын нөхцөлийг өөрөө нэмдэггүй), багийн цаашдын AI ашиглах дүрэм.

### B.7. Commit, push, PR

```bash
git add labs/lab13/secret-answer labs/docx/Lab13_report_team9.md
git diff --cached --stat
git commit -m "feat(lab13): AI-assisted secret answer hashing with review and tests"
git push -u origin lab13/amarbold-secret-answer
```

PR: base `main`. Reviewer нь **Г.Нармандах**. PR-ийн тайлбарыг PR #32-ын бүтцээр бөглөнө. CI ногоон болж Approve авсны дараа merge хийнэ.

## Шалгах хуудас

**Лаб 12**

- [ ] PR #31 review хийж Approve өгсөн, merge болсон
- [ ] Database ба нийт lint 0/0
- [ ] Before-update/after audit хадгалсан, ангилсан; High шинэчилсэн эсвэл blocker бичсэн
- [ ] `ci.yml`-д lint алхам нэмэгдэж, CI ногоон
- [ ] Тайлан, нотолгоо, PR (reviewer: Нармандах)

**Лаб 13**

- [ ] Ирмүүний PR review хийж Approve өгсөн
- [ ] Хоёр prompt тус тусдаа шинэ session-д, хариу өөрчлөлтгүй хадгалагдсан
- [ ] Харьцуулалт, review, засвар `ai-log.md`-д
- [ ] 5+ тест, бүгд ногоон; ESLint exit 0
- [ ] Тайлангийн өөрийн хэсэг, дуусах огноо, нийт дүгнэлт бөглөгдсөн
- [ ] PR нээгдэж, Нармандах reviewer болсон
