# Суурийн шалгалтын тэмдэглэл

2026-10-20-нд локал Windows, Node 24.14.1, npm 11.19.1 орчинд шалгав.

| Шалгалт                                             | Үр дүн                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Contracts + Database + API + React production build | Амжилттай                                                            |
| Prettier, generated OpenAPI drift, planning check   | Амжилттай                                                            |
| Шинэ API unit/HTTP тест                             | 25/25 амжилттай                                                      |
| Лаб 7 regression test                               | 15/15 амжилттай                                                      |
| Prisma generate, schema validate                    | Амжилттай; deepmerge-ts 8 override-той                               |
| npm audit                                           | Шалгах үеийн мэдэгдсэн эмзэг байдал 0                                |
| Dev API bootstrap, health, OpenAPI endpoint         | Амжилттай                                                            |
| Browser UI: register → login → GUARD post → list    | Headless Edge + Playwright, API fixture-тэй амжилттай                |
| Desktop 1280×850, mobile 390×844                    | Хоосон дэлгэц, page error, хэвтээ overflow байхгүй                   |
| PostgreSQL migration + integration, бодит SMTP      | Локал Docker/PostgreSQL байхгүй тул ажиллуулаагүй                    |
| Remote GitHub Actions, main protection              | Энэ локал шалгалтад remote CI, main protection-ийг баталгаажуулаагүй |

Browser plugin байхгүй тул regular Playwright хэрэглэсэн. Browser UI тест API fixture ашигласан учир өгөгдлийн сан, SMTP-тай end-to-end урсгалыг баталсан гэж үзэхгүй. PostgreSQL integration test нь `backend/test/integration/database.test.ts`-д, CI service нь `.github/workflows/foundation.yml`-д бэлэн.

## Шалгалтын хамрах хүрээ

`npm run check:layout` нь давхарга хоорондын хориотой import болон workspace бүтцийг шалгана. `npm run check:plan` нь хариуцагч, хугацаа, ажлын хамаарал болон API metadata-г тулгана. Database-ийн хэрэгжүүлээгүй хайлт, шүүлтүүр HTTP 501 буцаахыг HTTP тестээр шалгасан.

Seed, PostgreSQL migration/integration, Docker Compose, бодит SMTP болон deploy-г энэ локал шалгалтаар ажиллуулаагүй. JWT нь хэрэгжүүлэхээр төлөвлөсөн ажил.
