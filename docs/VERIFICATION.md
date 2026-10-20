# Суурийн шалгалтын тэмдэглэл

2026-10-20-нд локал Windows, Node 24.14.1, npm 11.19.1 орчинд шалгав.

| Шалгалт                                             | Үр дүн                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| Contracts + Database + API + React production build | Амжилттай                                                                 |
| Prettier, generated OpenAPI drift, planning check   | Амжилттай                                                                 |
| Шинэ API unit/HTTP тест                             | 25/25 амжилттай                                                           |
| Лаб 7 regression test                               | 15/15 амжилттай                                                           |
| Prisma generate, schema validate                    | Амжилттай; deepmerge-ts 8 override-той                                    |
| npm audit                                           | Шалгах үеийн мэдэгдсэн эмзэг байдал 0                                     |
| Dev API bootstrap, health, OpenAPI endpoint         | Амжилттай                                                                 |
| Browser UI: register → login → GUARD post → list    | Headless Edge + Playwright, API fixture-тэй амжилттай                     |
| Desktop 1280×850, mobile 390×844                    | Хоосон дэлгэц, page error, хэвтээ overflow байхгүй                        |
| PostgreSQL migration + integration, бодит SMTP      | Локал Docker/PostgreSQL байхгүй тул ажиллуулаагүй                         |
| Remote GitHub Actions, main protection              | Push/remote settings өөрчлөөгүй; шинэ workflow дараагийн PR дээр ажиллана |

Browser plugin байхгүй тул regular Playwright хэрэглэсэн. Browser UI тест API fixture ашигласан учир өгөгдлийн сан, SMTP-тай end-to-end урсгалыг баталсан гэж үзэхгүй. PostgreSQL integration test нь `backend/test/integration/database.test.ts`-д, CI service нь `.github/workflows/foundation.yml`-д бэлэн.

Хөгжүүлэлтийн явцад Vite-ийн shared CommonJS dependency cache шинэ export-ийг хуучнаар унших алдааг илрүүлж, dev startup-д `--force` нэмээд ижил урсгалыг дахин шалгасан. Contract өөрчлөгдвөл generate хийгээд dev серверээ дахин асаах зааврыг SETUP-д оруулсан.

## Давхаргын бүтэц өөрчилсний дараах шалгалт

`frontend/`, `backend/`, `database/`, `devops/` бүтцээр build, 25 API + 15 Лаб 7 тест, Prisma schema validation, health/OpenAPI bootstrap болон дээрх browser урсгалыг дахин ажиллуулж амжилттай шалгасан. Database-ийн хэрэгжүүлээгүй query нь HTTP 501 болж буцаж байгааг хоёр шинэ HTTP тестээр шалгав. `npm run check:layout` нь давхарга хоорондын хориотой import, workspace бүтцийг; `check:plan` нь зурагт төлөвлөгөөтэй таарсан owner/week/dependency-г шалгана. Lockfile-д хуучин `apps/` workspace үлдээгүй.

Шинэ seed, PostgreSQL migration/integration, Docker Compose, бодит SMTP болон deploy-г ажиллуулаагүй. JWT шилжилт төлөвлөгөөнд байгаа; одоогийн opaque session хэрэгжүүлэлтийг JWT гэж баталгаажуулаагүй.
