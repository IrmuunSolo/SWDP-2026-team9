# Шалгалт ба Done шалгуур

## Локал команд

```powershell
npm.cmd run db:generate
npm.cmd run check
npm.cmd test
git diff --check
```

`check`: contracts + API + web build/typecheck, Prettier, generated OpenAPI drift, 8–15-р долоо хоногийн идэвхтэй төлөвлөгөө. `test`: шинэ API unit/HTTP tests + Лаб 7-ын 15 regression test. HTTP tests нь жинхэнэ Nest серверийг loopback дээр асааж, DB provider-ийг fixture-ээр орлуулдаг; энэ нь PostgreSQL integration test-ийг орлохгүй.

## PostgreSQL integration test

Тусдаа **campusfind_test** database шаардана; test нь нэрийг шалгаж, development DB дээр санамсаргүй ажиллахыг зогсооно. DB нэрийг DATABASE_URL-д солихоос өмнө өөр terminal дээр development серверээ ашиглаж байгаа эсэхээ анхаар. PostgreSQL локал compose ажиллаж байхад repo root дээр:

```powershell
docker compose -p swdp-2026-team9 -f devops/compose.yaml exec postgres psql -U campusfind -d postgres -c "CREATE DATABASE campusfind_test;"
$env:TEST_DATABASE_URL = "postgresql://campusfind:local_dev_only@localhost:5432/campusfind_test?schema=public"
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npm.cmd run db:deploy
npm.cmd run build -w @campusfind/contracts
npm.cmd run test:integration
Remove-Item Env:DATABASE_URL
Remove-Item Env:TEST_DATABASE_URL
```

`CREATE DATABASE`-ийг эхний удаа л ажиллуул. Test нь зөвхөн өөрийн үүсгэсэн user/post-ийг цэвэрлэнэ; database truncate/reset хийхгүй. SMTP delivery-г test capture-ээр орлуулж raw token-оор verify request явуулна. Mailpit-ийн жинхэнэ SMTP хүргэлтийг [SETUP](SETUP.md)-ийн smoke урсгалаар тусад нь шалгана.

Integration test хамрах хүрээ: register → verify one-use token → 5 буруу login/lock → lock хугацаа дуусах → login cookie → GUARD validation → post persistence/list → blocked session 403 → logout/revoked cookie 401.

## CI

Лаб 7-ын `CampusFind checks` job хадгалагдана. Нэмсэн `Foundation checks` job нь Node24 + root npm ci + Prisma generate + build/format/contracts/plan + unit tests + PostgreSQL17 service migration/integration test ажиллуулна. Remote push/PR бүрд ажиллана. CI-г локал ажилласан гэж төөрөгдүүлэхгүй; PR дээр бодит Actions run-ийг нээж дүнг шалгана.

Docker Desktop байхгүй машин дээр DB integration test ажиллахгүй. Unit, HTTP fixture test, schema validate, build хийж болно. PR-ийг merge хийхийн өмнө CI-ийн DB test ногоон болох шаардлагатай.

## Story бүрийн тест

| Модуль        | Заавал шалгах нөхцөл                                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | домэйн/code format, unique, expire/reused token, SMTP failure retry, 5/10 минут lock, logout revoke, blocked user                                               |
| Post          | extra authorId/role injection reject, required fields, future date, FOUND/GUARD, LOST field separation, page limit, mask                                        |
| Search/filter | title+description, case/trim, хосолсон AND, date range, inactive/blocked author exclusion, 2 секундийн хэмжилтийн орчин/өгөгдөл                                 |
| Chat          | finder ба claimant л нэвтрэх, outsider/admin 403/404, senderId injection reject, duplicate chat, cursor/polling timestamp                                       |
| Secret        | question private, hash absent in response, wrong answer generic error, limit, secret-less manual claim                                                          |
| Handover      | finder-only owner assignment, verified claim, owner≠finder, outsider reject, one person repeated confirm, хоёр зэрэг confirm transaction, completed idempotency |
| Photo         | signature, jpg/png, <5MB, 4 дэх зураг reject, path traversal, өөр author, quota concurrency                                                                     |
| Notification  | хоёр сувгийн preference, зөв хэрэглэгч, duplicate/retry, sensitive payload absent, ≤5 минут                                                                     |
| Admin         | MEMBER reject, reason required, audit saved, block existing session, own-block reject, private chat bypass absent                                               |

Лаб 7-ын бизнесийн санааг ашиглаж болно. Гэхдээ client-ээс finderId/ownerId авч итгэдэг in-memory method-ийг API authentication гэж хуулж хэрэглэхгүй.

## Definition of Ready

Issue/acceptance criteria тодорхой; owner/reviewer оноосон; API input/output/access тохирсон; хамаарах shared PR main-д орсон эсвэл Draft blocker бичсэн; migration хэрэгтэй эсэх тодорхой.

## Definition of Done

- Story-ийн бүх Acceptance Criteria биелсэн, UI/API нэгдсэн урсгал үзүүлсэн.
- Input validation, owner/participant authorization, negative tests, data privacy шалгасан.
- `npm run check`, `npm test`, холбогдох integration tests ногоон.
- Migration/contract/generated docs ижил, .env нууц ороогүй.
- Нэг бусад гишүүний approval, comment resolved, main-тай conflict байхгүй, CI ногоон.
- PR main-д merge болсон, issue/Project төлөв шинэчилсэн, screenshot/хэмжилт шаардлагатай бол хавсаргасан.

Review ба In Progress тус бүр WIP=2. Дутуу story-ийн SP-ийг velocity-д тооцохгүй. Backlog-ийн статус нь бүтээгдэхүүний Post.status-аас өөр ойлголт.
