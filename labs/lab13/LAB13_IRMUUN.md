# Лаб 13 — Л.Ирмүүний ээлж (2-р ээлж)

**Даалгавар:** `validateRegistration` — бүртгэлийн маягтын validation (US-01, багшийн жишээ даалгавар)
**Branch:** `lab13/irmuun-registration-validation`
**Хавтас:** `labs/lab13/registration-validation/`
**Reviewer:** Э.Амарболд
**Дэлгэрэнгүй дүрэм:** `LAB13_TEAM9_GUIDE.md`

Нармандахын ээлжээр `labs/lab13/package.json`, тайлангийн загвар (`labs/docx/Lab13_report_team9.md`) болон жишээ хавтас `labs/lab13/login-lockout/` бэлэн болсон. Бүтэц, `ai-log.md`-ийн хэлбэр, тестийн хэв маягийг тэндээс загвар болгоно.

## 0. Өмнөх ээлжийг хүлээж авах

1. PR #32 (`lab13/narmandakh-login-lockout`)-ийг review хийж Approve өгнө. Шалгах зүйлс:
   - `labs/lab13/login-lockout/ai-log.md`-д prompt, хариу бүтэн хадгалагдсан эсэх.
   - Review-ийн 3 асуудал тест болон кодтой таарч байгаа эсэх.
   - `npm --prefix labs/lab13 test` 9/9 давж байгаа эсэх.
2. PR #32 merge болсны дараа ээлжээ эхэлнэ.

## 1. Бэлтгэл (PowerShell, repo root)

```powershell
git switch main
git pull --ff-only origin main
git switch -c lab13/irmuun-registration-validation
New-Item -ItemType Directory -Force -Path labs/lab13/registration-validation | Out-Null
npm.cmd --prefix labs/lab13 test
```

Сүүлийн команд Нармандахын 9 тестийг давуулах ёстой.

## 2. AI-д prompt өгөх

Хоёр prompt-ийг **тус тусдаа, өмнөх түүхгүй шинэ session-д** өгнө: ChatGPT-ийн New chat, Claude-ийн New chat эсвэл Copilot Chat. Repo нээлттэй IDE-ийн Copilot эсвэл өмнөх ярианы түүхтэй session-д өгвөл тодорхойгүй prompt-ийн хариу бодит бус болно.

Хариуг **өөрчлөлтгүй, бүтнээр** хуулж `labs/lab13/registration-validation/ai-log.md`-д хадгална. Хэрэгслийн нэр, огноо, цагийг бичнэ.

**Prompt 1 — тодорхойгүй:**

```
Бүртгүүлэх формын validation бичээд өгөөч
```

**Prompt 2 — тодорхой:**

```
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

## 3. Харьцуулалт ба review

`ai-log.md`-д хоёр хариуг харьцуулсан хүснэгт бичнэ: технологи, ажиллах эсэх, тестлэх боломж, тест, аюулгүй байдал, хамрах хүрээ.

Тодорхой prompt-ийн кодыг Лекц 13-ын шалгуураар (логик, аюулгүй байдал, найдвартай байдал, стиль, тест) review хийнэ. Хариулах асуултууд:

- 8 дүрэм бүр хэрэгжсэн үү? Хил (1/2/80/81 тэмдэгт, 11/12/128/129 нууц үг) зөв үү?
- `student@example.edu.evil.com`, `student@sub.example.edu`, `Student@EXAMPLE.EDU` зэрэг домэйнуудыг яаж шийдсэн бэ?
- Нууц үгийг trim хийчихсэн үү? Нууц үг errors эсвэл value-д санамсаргүй орсон уу?
- Эхний алдаагаар зогсоогүй юу? Input объектыг өөрчлөөгүй юу?
- AI-ийн тестүүд хилийн тохиолдлыг үнэхээр шалгаж байна уу, эсвэл зөвхөн амжилттай тохиолдлыг уу?

Production-ийн дүрэмтэй тулгах жишиг: `packages/contracts/src/index.ts`-ийн `registerSchema`, `backend/src/common/security.ts`-ийн `isUniversityEmail`.

Олдсон 2–3 асуудлыг (эсвэл «асуудал олдоогүй, учир нь …» гэсэн үндэслэлийг) байршил, ач холбогдол, засвартай нь бичнэ. Хамгийн хүчтэй нотолгоо нь: эцсийн тестүүдийг AI-ийн анхны код дээр түр ажиллуулж, унасан тестийн гаралтыг `ai-log.md`-д хадгалах.

**Анхааруулга:** AI-ийн анхны кодыг `.js` файлаар repo-д хадгалахгүй. Зөвхөн `ai-log.md`-ийн code block-д байна. Засаагүй AI код root ESLint-ийг унагана.

## 4. Эцсийн код ба тест

- `labs/lab13/registration-validation/registrationValidation.js`: review-ийн дагуу засварласан код.
- `labs/lab13/registration-validation/registrationValidation.test.js`: 5-аас доошгүй тест (хэвийн 2, хил 2, mock 1), Arrange → Act → Assert бүтэцтэй.

```powershell
npm.cmd --prefix labs/lab13 test
npx.cmd --no-install eslint labs/lab13 --max-warnings=0
git diff --check
```

Бүх тест (Нармандахын 9 + өөрийн) давж, хоёр команд exit 0 байна.

## 5. Тайлан

`labs/docx/Lab13_report_team9.md`-ийн **«Л.Ирмүүн — Бүртгэлийн validation»** хэсгийг Нармандахын хэсгийн бүтцээр бөглөнө:

- Prompt харьцуулалт
- Review (асуудлын хүснэгт)
- Тест ба эцсийн код (тестийн жагсаалт, шалгалтын үр дүн)
- AI ашиглалтын ил тод байдал (AI юуг бичсэн, өөрөө юу хийсэн)

Гарчгийн «Хүлээгдэж байна» төлөвийг «Хийгдсэн» болгоно. Бусдын хэсгийг өөрчлөхгүй.

## 6. Commit, push, PR

```powershell
git add labs/lab13/registration-validation labs/docx/Lab13_report_team9.md
git diff --cached --stat
git commit -m "feat(lab13): AI-assisted registration validation with review and tests"
git push -u origin lab13/irmuun-registration-validation
```

PR: base `main`. Reviewer нь **Э.Амарболд**. PR-ийн тайлбарыг PR #32-ын бүтцээр бөглөнө. CI ногоон болж Approve авсны дараа merge хийнэ. Merge болсныг Амарболдод мэдэгдэнэ.

## Шалгах хуудас

- [ ] PR #32 review хийж Approve өгсөн
- [ ] Хоёр prompt тус тусдаа шинэ session-д, хариу өөрчлөлтгүй хадгалагдсан
- [ ] Харьцуулалт, review (2–3 асуудал эсвэл үндэслэл), засвар `ai-log.md`-д бичигдсэн
- [ ] 5+ тест, бүгд ногоон; ESLint exit 0
- [ ] AI-ийн анхны код `.js` файлаар ороогүй, production код өөрчлөгдөөгүй
- [ ] Тайлангийн өөрийн хэсэг бөглөгдсөн
- [ ] PR нээгдэж, Амарболд reviewer болсон
