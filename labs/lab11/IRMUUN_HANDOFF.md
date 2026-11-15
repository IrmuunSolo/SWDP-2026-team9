# Лаб 11 — Ирмүүнээс Нармандахад хүлээлгэн өгөх

Огноо: 2026-11-16. Branch: `lab11/irmuun-eslint-frontend`. Суурь: `3143e22`.

PR: [#29](https://github.com/IrmuunSolo/SWDP-2026-team9/pull/29). Кодын commit: `a5fa9cc`. Нармандахад (`Narmandah-cyber`) review хүсэлт өгсөн; approval ба merge хүлээгдэж байна. Кодын commit-ийн хоёр CI ногоон, дэлгэрэнгүй нь `irmuun-remote-ci.json` ба багийн тайланд бий.

## Дууссан ажил

- ESLint 10.15.0, typescript-eslint 8.72.2, `@eslint/js` 10.0.1, globals 17.14.0; root flat config, lint/lint:fix.
- 4.5-ын baseline-ийг ижил source/config-аар дахин баталгаажуулсан: 57 файл, 15 error, 0 warning, exit 1.
- Frontend-ийн 11 finding арилсан: 21 файл, 0 error, 0 warning; strict exit 0.
- Root after: 57 файл, 4 error, 0 warning. Backend-ийн дараах finding үлдсэн; root lint exit 1 нь энэ шатанд хүлээгдэж буй үлдэгдэл.
- Build/check, frontend 4 тест, API 25 + Лаб 7 15, fixture browser, тусдаа campusfind_test integration 1, бодит API/browser давсан.
- Тайлан: [Lab11_report_team9.md](../docx/Lab11_report_team9.md).

## Нармандахын дараагийн ажил

Өмнөх PR main-д merge болсны дараа main-аа шинэчилж `lab11/narmandakh-static-fixes` branch үүсгэнэ. Root-оос `npm ci`, `npm run db:generate`, `npm run lint` ажиллуулж үлдэгдлийг батална.

| Файл:мөр:багана                                   | Rule / тоо                              | Нягтлах зүйл                                                                                                  |
| ------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `backend/src/common/http.ts:6:47`, `:6:52`        | `@typescript-eslint/no-explicit-any` ×2 | HTTP envelope middleware-ийн request/response-д тохирох Express төрөл; response өөрчлөх зан төлөвийг хадгалах |
| `backend/test/integration/database.test.ts:87:52` | `@typescript-eslint/no-explicit-any` ×1 | Error assertion-ийн төрөл/narrowing; бодит assertion-ийг хадгалах                                             |
| `backend/test/unit/http.test.ts:26:37`            | `@typescript-eslint/no-explicit-any` ×1 | HTTP fixture/provider-ийн төрөл; test seam-ийг хадгалах                                                       |

`irmuun-lint-after-all.json` нь source/line/rule-тай бодит жагсаалт. Contracts, database, root scripts, Лаб 7-д энэ config-аар одоогоор finding 0. Дараагийн scan өөрчлөгдвөл бодит дүнг бичнэ. CI-д lint нэмэх нь Амарболдын гуравдугаар ээлжийн ажил; одоогийн root check-д lint автоматаар ороогүй.

## Амарболдод шилжүүлэх audit

| Хүрээ / үе                                | Critical | High | Medium | Low | Info | Exit |
| ----------------------------------------- | -------- | ---- | ------ | --- | ---- | ---- |
| Root / lint tooling суухаас өмнөх initial | 0        | 4    | 0      | 0   | 0    | 1    |
| Root / tooling орсон handoff scan         | 0        | 4    | 7      | 0   | 0    | 1    |
| Lab07 / initial ба handoff                | 0        | 0    | 0      | 0   | 0    | 0    |

Нийт тоо нь npm-ийн dependency vulnerability node count; давхардалгүй advisory-ийн тоо биш. High: `@nestjs/platform-express`, `body-parser`, `multer`, `zod`. Medium: `typescript-eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`, `minimatch`.

- `audit-initial-*.json`-ийг хадгалсан; `irmuun-audit-handoff-*.json` нь install-ийн дараах тусдаа scan.
- Version update/audit fix хийгээгүй. Амарболд update-ийн өмнө scan-аа дахин авч, chain/advisory/fixed range/peer compatibility-г нягтална.
- npm-ийн `fixAvailable` саналд typescript-eslint-ийн өөр хувилбар дурдагдсан. Үүнийг баталгаатай аюулгүй хувилбар гэж шууд ашиглахгүй; advisory range ба одоогийн peer requirement-тай тулгана.
- Нармандах Nest/body-parser/multer ба Zod өөрчлөлтийн API/validation/auth нөлөөг review хийнэ. Zod major update нь shared contract/generated docs/consumer өөрчлөлт шаардаж болохыг төлөвлөнө.

## Нотолгооны тайлбар

- Анхны `lint-before-meta.txt`-д exit code хоосон байсан. Анхны файлыг засалгүй, ижил config/source-аар хийсэн verification-ийн exit 1-ийг тусад нь хадгалсан.
- Анхны stylish TXT-ийн кирилл path encoding буруу харагдсан. Анхны JSON зөв бөгөөд finding/source нь бодит файлуудтай таарсан. UTF-8 readable after log нэмсэн.
- `eslint.config.mjs`-ийг зөвхөн Prettier-ээр форматласан. Byte hash өөрчлөгдсөн ч effective App config ижил; rule/ignore нэмээгүй, хасаагүй.
- `01-lint-before.png`, `irmuun-lint-after-frontend.png` нь хадгалсан JSON-оос үзүүлсэн тайлангийн screenshot; анхны terminal screenshot биш. Хажуугийн HTML эхүүд нь мөн бий.
- `irmuun-browser-fixture.txt` нь эхний focus assertion race-ийн унасан run; `irmuun-browser-fixture-verified.txt` нь focus шилжихийг хүлээдэг болгосны дараах амжилттай run. Хоёуланг хадгалсан.
- Browser-ийн амжилттай upload/search урсгал нь fixture; бодит API дээр planned 501-ийг зөв харуулж байгааг тусад нь шалгасан. SMTP болон шинэ Compose build шалгаагүй.

Анхны болон after JSON-ийг дарж бичихгүй. Нармандах өөрийн incoming/after, Амарболд багийн эцсийн `lint-after-all.*`/audit/CI нотолгоог тусдаа нэрээр нэмнэ.
