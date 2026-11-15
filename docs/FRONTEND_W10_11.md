# 10–11-р долоо хоног — Frontend хүлээлгэн өгөх

Хариуцагч: Л.Ирмүүн (frontend/PO). Шалгасан: 2026-11-16.

10–11-р долоо хоногт би өмнөх frontend сууриа үргэлжлүүлж, LOST/FOUND зарын форм, зураг сонгох ба илгээх урсгал, хайлт/шүүлтүүр, pagination болон зарын дэлгэрэнгүй хуудсыг хөгжүүллээ. Энэ баримтад хэрэгжүүлсэн өөрчлөлт, туршилтын үр дүн, ажиллуулах заавар болон багийн бусад гишүүдтэй нэгтгэх ажлыг тусгав.

## Суурь ба төлөвлөгөө

- HTTPS fetch-ээр баталгаажуулсан origin/main: `97527f3` (Лаб 8 Compose ба баталгаажуулсан тайлан). Шинэ branch: `feat/w10-11-frontend-posts-search`.
- Ажил эхлэхэд working tree цэвэр байсан. Хуучин `lab08/irmuun-image` (`519c23a`)-ийг merge/reset хийгээгүй.
- `docs/planning/delivery-plan.json` дахь 10–11-р долоо хоногийн хуваарийн дагуу US-04/07 форм, US-05 upload UI, US-09/10 хайлт/шүүлтүүр дээр ажилласан.
- Дараалал: shared validation → post ID-д тулгуурласан upload → URL query/list/detail → fixture/browser → бодит API/DB → handoff.
- Суурийн React/TypeScript/Vite, нүүр, header/footer, auth урсгалыг үргэлжлүүлсэн. Нэвтрэлт HttpOnly cookie бүхий opaque session хэвээр. JWT шилжилт хийгээгүй.

## Өөрчилсөн файлууд

| Файл                                                   | Үүрэг                                                                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/features/posts/shared/PostForm.tsx`      | Байгаа LOST/FOUND форм; shared schema, талбарын алдаа/focus, орон нутгийн огноо, pending/давхар submit хамгаалалт, create → upload, хэсэгчилсэн retry |
| `frontend/src/features/posts/shared/postUi.ts`         | Shared schema ашиглах validation, local calendar date, query parse/serialization, Монгол алдаа, файл MIME/хэмжээ/тоо                                  |
| `frontend/src/features/posts/shared/UploadedPhoto.tsx` | Баталгаажсан upload ID-аар binary зураг татах, loading/error/retry, object URL cleanup                                                                |
| `frontend/src/features/posts/shared/PostContent.tsx`   | Жагсаалт/дэлгэрэнгүйн нийтлэг masked public мэдээлэл                                                                                                  |
| `frontend/src/features/posts/PostsPage.tsx`            | q/type/category/location/from/to, pagination/meta, URL history/reload, хоосон/алдаа/retry, AbortController + live response хамгаалалт                 |
| `frontend/src/features/posts/PostDetailPage.tsx`       | UUID шалгалт, getPost, loading/404/error/retry; дараагийн үеийн ажилладаггүй товч нэмээгүй                                                            |
| `frontend/src/api/client.ts`                           | FormData үед browser boundary; binary getPhoto; AbortSignal; JSON биш 401 ч session-expired; validation details                                       |
| `frontend/src/App.tsx`                                 | Одоогийн auth gate дотор `/posts/:postId` маршрут нэмсэн                                                                                              |
| `frontend/src/styles.css`                              | Шүүлтүүрийн responsive grid, preview, detail, error төлөв; одоогийн өнгө/layout хадгалсан                                                             |
| `frontend/package.json`                                | Dependency нэмээгүй; frontend unit/browser/real-API тестийн 3 команд                                                                                  |
| `frontend/test/posts.test.mjs`                         | Бодит helper/client модулиудын validation/query/transport тест; байгаа TypeScript-ээр түр transpile хийнэ                                             |
| `frontend/test/browser.mjs`                            | Зөвхөн тестийн HTTP fixture, desktop/mobile interaction/race/upload/error тест; production import байхгүй                                             |
| `frontend/test/browser-api.mjs`                        | Зөвхөн campusfind_test дээр бодит API/browser; өөрийн test user/posts-ийг цэвэрлэнэ                                                                   |
| `docs/FRONTEND_W10_11.md`                              | Энэ төлөв, команд, dependency ба QA                                                                                                                   |

## Browser зам ба зан төлөв

- `/posts`: нэвтэрсэн хэрэглэгчийн жагсаалт, хайлт/шүүлтүүр. Жишээ `/posts?q=түлхүүр&type=FOUND&category=KEYS&location=LIBRARY&from=2026-01-01&to=2026-11-16&page=2&pageSize=10`.
- Хайх дарахад шүүлтүүр URL-д орж, page=1 болно. Form өөрчлөлтүүдийг **Хайх**-аар хэрэгжүүлнэ. **Шүүлтүүр цэвэрлэх** бүх filter/page/pageSize-ийг default болгоно. Browser back/forward ба reload нь URL-аас сэргээнэ. `useSyncExternalStore` нь initial subscribe-ээс өмнөх Back өөрчлөлтийг ч snapshot-аар сэргээнэ; давтан QA-д илэрсэн mount/history race-ийг зассан.
- Хоосон query болон default page=1/pageSize=20-ийг API-д илгээхгүй. URL-ийн танихгүй түлхүүр API руу дамжихгүй. Буруу page/date/enum үед API дуудахгүй, тайлбар ба цэвэрлэх товч харуулна.
- `/posts/new/lost`, `/posts/new/found`: shared contract-аар validation; FOUND/GUARD үед байр заавал. Алдаанд өгөгдөл/зураг хэвээр. Огноог browser-ийн local year/month/day-аар шалгана; UTC toISOString ашиглахгүй.
- `/posts/:postId`: getPost-д тулгуурласан дэлгэрэнгүй. Chat/claim/handover/edit/close UI нэмээгүй.
- Post амжилттай үүсвэл формыг түгжиж, амжилтын тайлбар ба **Нийтэлсэн зарыг харах** холбоос харуулна. Upload дуустал хуудсыг хадгалж retry хийх боломжтой; автоматаар redirect хийгээгүй.

## API contract ба бодит бэлэн байдал

Бүх замын prefix `/api/v1`. JSON амжилт `{data: ...}`; алдаа `{error:{code,message,requestId,details?}}`.

| Route ID / HTTP                                         | Хүсэлт → хариу                                                                        | Latest main дээр                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `createPost` POST `/posts`                              | createPostSchema (authorId байхгүй) → 201 postSchema                                  | Бэлэн; бодит API/DB/browser шалгасан                  |
| `listPosts` GET `/posts`                                | q,type,category,location,from,to,page,pageSize → `{items,meta:{page,pageSize,total}}` | Жагсаалт/pagination бэлэн; идэвхтэй хайлт/filter 501  |
| `getPost` GET `/posts/{postId}`                         | UUID → postSchema                                                                     | Бэлэн; бодит detail/reload шалгасан                   |
| `uploadPhoto` POST `/posts/{postId}/photos`             | FormData-ийн нэг `file` → 201 `{id,url,mimeType,bytes}`                               | Planned/501; амжилт ба partial failure зөвхөн fixture |
| `getPhoto` GET `/photos/{photoId}`                      | UUID → image/jpeg эсвэл image/png binary                                              | Planned/501; амжилт/алдаа/retry зөвхөн fixture        |
| `deletePhoto` DELETE `/posts/{postId}/photos/{photoId}` | → messageSchema                                                                       | Planned/501; нийтлэгдсэн зураг устгах UI нэмээгүй     |

FormData хүсэлтийн Content-Type болон multipart boundary-г browser үүсгэдэг. JSON client-ын бусад хэрэглэгч хэвээр. Cookie `credentials: include`, `X-CampusFind: web`, expired-session event хэвээр. getPhoto-ийн binary хариуг Blob хэлбэрээр уншина. Зургийг contract-ын getPhoto ID замаар авна.

Фото сонголт JPG/PNG, тус бүр `<5*1024*1024` bytes, нийт ≤3. Нэг нэгээр upload хийнэ. Амжилттай бүрийн ID-г санах ойд хадгалж retry-д алгасана. Upload алдахад post ID хэвээр, createPost дахин дуудагдахгүй. 401/403/501 үед дараагийн файлыг автоматаар үргэлжлүүлэхгүй. Сонголтоос хасах нь илгээгээгүй локал файлд хамаарна; серверийн зураг устгасан мэт үзүүлэхгүй. Preview ба татсан binary object URL-уудыг remove/unmount үед revoke хийнэ.

Хоосон нийт жагсаалт, хайлтад үр дүнгүй, хоосон page, loading, network, 403, 404, 501, серверийн алдаа тусдаа тайлбартай. Өмнөх хүсэлтийг abort хийхийн зэрэгцээ live flag-аар оройтож ирсэн response-оос хамгаална.

## Shared contract болон багийн үргэлжлүүлэх ажил

Shared contract, backend, database/migration, auth архитектур өөрчлөөгүй. App shell/API client өөрчлөлтүүдийг Нармандах consumer/security талаас review хийнэ. Frontend package-ийн script-үүдийг Амарболд CI/tooling талаас review хийнэ.

**Нармандах:**

1. Multipart `file` facade, AUTHOR/verified session/object permission, алдааны код ба uploadPhoto/deletePhoto-г бодит storage adapter-тэй холбоно. 401/403/404/201/501 integration тест хадгална.
2. Post list/detail response-д зургийг олох баталгаатай interface хэрэгтэй. Миний санал: `postSchema.photos: photoSchema[]`, хоосон үед `[]`; postView нь зөвхөн public photo metadata гаргана. Одоогийн response-д энэ талбар байхгүй учраас list/detail gallery-ийн холболт хүлээгдэж байна. Contract → generated docs → producer → consumer-ийг shared PR-аар review хийсний дараа PostContent-д gallery холбоно. Хуудас дахин нээгдэхэд зурагтай/зураггүйг зөв ялгах нь үүнээс хамаарна.
3. getPhoto route metadata-ийн `output: photoSchema` нь OpenAPI дахь binary response-той зөрдөг. OpenAPI image/jpeg/png нь binary гэж зөв заасан; client зөвхөн энэ ID-д binary салбар ашиглана. Дараагийн shared contract PR-д binary output төрлийг ил тод болгоно.
4. createPost-ийн future-date шалгалт сервер дээр UTC calendar ашигласан хэвээр. Browser local calendar-тай UTC шөнийн заагт зөрөх боломжтой; campus timezone/date-only бодлогыг хамт тохирч backend тест нэмнэ.

**Амарболд:**

1. `database/src/queries/search.ts`, `filters.ts`-ийн planned seam: parameterized full-text/index, нийлмэл AND filters, date range, total болон тогтвортой pagination. Идэвхгүй/blocked author хасалт, хэмжилтийн нөхцөлтэй ≤2 секундийг шалгана.
2. Private storage adapter, signature validation (frontend MIME нь аюулгүй байдлын баталгаа биш), хэмжээ/3 зургийн quota, зэрэгцээ upload, binary Content-Type, устгал. Нармандахтай HTTP/data interface тохирно.
3. CI-д frontend-ийн тусдаа `npm run test -w @campusfind/web` болон Playwright runtime/browser job-ийг тусдаа өөрчлөлтөөр нэмнэ. Одоогийн root npm test frontend тестийг автоматаар дуудахгүй.

List/detail response-д зургийн мэдээлэл байхгүй тул detail хуудсанд зураг харах боломж хараахан бэлэн болоогүй гэсэн тайлбар харуулна. Upload амжилттай болсон одоогийн хуудсанд серверээс ирсэн ID-тай зураг харуулдаг. Зураг, хайлт/шүүлтүүрийн API болон өгөгдлийн давхаргыг нэгтгэсний дараа US-05/09/10-ийн нийт acceptance шалгуурыг батална.

## PowerShell — локал хөгжүүлэлт

Бүх командыг repo root дээр. Байгаа `.env`-ийг дарж бичихгүй. Dependency байхгүй үед `npm.cmd ci`, `npm.cmd run db:generate`; DB/SMTP setup нь `docs/SETUP.md`.

```powershell
# Terminal 1: local API 3000
npm.cmd run dev:api
# Terminal 2: local web 5173, /api proxy → 3000
npm.cmd run dev:web
```

Browser `http://localhost:5173/posts`; Mailpit `http://localhost:8025`. Cookie/origin-д localhost ба 127.0.0.1-ийг сольж хэрэглэхгүй.

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test -w @campusfind/web
git diff --check
```

## PowerShell — Лаб 8 Compose (локал портоос тусдаа)

```powershell
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml up -d --build --wait
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml ps
```

Compose web `http://localhost:15173`, API host `http://localhost:13000/api/v1`, Mailpit `http://localhost:18025`. Container хооронд web proxy `http://api:3000`, SMTP `mailpit:1025`, postgres `postgres:5432`; DB host порт нийтлээгүй. Код image-д COPY хийгддэг тул өөрчлөлтөө шалгахдаа rebuild хэрэгтэй. Энэ удаа Compose stack-ийг дахин build хийж шалгаагүй. Өмнөх Compose auth/integration шалгалтын үр дүн `labs/docx/Lab8_report_team9.md`-д бий. Development өгөгдлийг хадгалахын тулд volume устгах команд ашиглахгүй.

## PowerShell — тусдаа test DB ба browser QA

Энэ ажлын тестэд development volume холбохгүйгээр дараах түр DB ашигласан. `campusfind-w10-11-test-db` нэр болон 15432 сул үед эхний командыг нэг удаа ажиллуулна.

```powershell
docker run --detach --name campusfind-w10-11-test-db --publish 127.0.0.1:15432:5432 --env POSTGRES_USER=campusfind --env POSTGRES_PASSWORD=local_test_only --env POSTGRES_DB=campusfind_test --tmpfs /var/lib/postgresql/data postgres:17-alpine
docker exec campusfind-w10-11-test-db pg_isready -U campusfind -d campusfind_test
$env:TEST_DATABASE_URL = 'postgresql://campusfind:local_test_only@localhost:15432/campusfind_test?schema=public'
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npm.cmd run db:deploy
npm.cmd run test:integration
Remove-Item Env:DATABASE_URL
```

Тестийн DB нэрийг script шалгана. Development DB/volume-д reset/truncate/delete хийгээгүй. Түр контейнер зогсоход tmpfs өгөгдөл арилна; дараагийн тестэд дахин migration шаардлагатай.

Browser шалгалтыг Playwright болон Chromium ашиглан хийсэн. Төслийн dependency-д шинэ package нэмэлгүй, Playwright CLI-г npm-ийн түр cache-аас ажиллуулсан. Тестийг дахин ажиллуулахдаа доорх командаар Playwright runtime-ийн замыг тохируулна. Playwright package нь орчноос шууд олддог бол PLAYWRIGHT_MODULE шаардлагагүй; стандарт байршлаас өөр Chromium ашиглах үед QA_CHROMIUM-д executable-ийн замыг өгнө.

```powershell
npx.cmd --yes --package @playwright/cli playwright-cli --version
# Түр npm cache дахь бэлэн Playwright runtime-ийг олох:
$qaNpxRoot = Join-Path (npm.cmd config get cache).Trim() '_npx'
$qaRuntime = Get-ChildItem -LiteralPath $qaNpxRoot -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName 'node_modules\playwright\index.mjs') } |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (!$qaRuntime) { throw 'Playwright runtime олдсонгүй.' }
$env:PLAYWRIGHT_MODULE = Join-Path $qaRuntime.FullName 'node_modules\playwright\index.mjs'
# Тухайн runtime-д тохирох Chromium байхгүй үед нэг удаа:
node (Join-Path $qaRuntime.FullName 'node_modules\playwright\cli.js') install chromium
$env:QA_OUTPUT_DIR = Join-Path $env:TEMP 'campusfind-w10-11-qa'
npm.cmd run test:browser -w @campusfind/web
# Бодит API/browser-д дээрх TEST_DATABASE_URL хэвээр шаардлагатай:
npm.cmd run build
npm.cmd run test:browser:api -w @campusfind/web
Remove-Item Env:TEST_DATABASE_URL,Env:PLAYWRIGHT_MODULE,Env:QA_OUTPUT_DIR
```

Fixture script Vite-г түр `localhost:5174` дээр өөрөө асааж/зогсооно. Бодит API/browser script Vite `localhost:5175`, API `127.0.0.1:13001` ашиглана; production mock route байхгүй. Эдгээр нь QA порт, dev/Compose порт биш. Бодит browser test зөвхөн тусдаа test DB дээр баталгаажсан түр хэрэглэгч бэлтгэж, UI-аар login хийдэг; register/SMTP-г орлохгүй. Root build ба test DB migration-ийг урьдчилан хийсэн байх шаардлагатай.

## Шалгалтын үр дүн ба хязгаарлалт

| Шалгалт                 | Үр дүн                                                                                                                                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`         | PASS                                                                                                                                                                                                                                                                                                                 |
| `npm test`              | API 25/25 + Лаб 7 15/15; бүгд амжилттай                                                                                                                                                                                                                                                                              |
| Frontend unit/transport | 4/4: shared validation, local date, query/range/pagination, file limits, FormData boundary, binary, cookie/CSRF, 401/403/501/503, abort                                                                                                                                                                              |
| Fixture browser         | PASS: list → filter/page → reload/back/forward; invalid range; old/new request race; empty backlog/results; network/server retry; 401 redirect, 403/501; detail; GUARD/future date/focus; MIME/5MB/4 файл; remove; create failure preserves data; duplicate submit; partial upload retry; binary image failure/retry |
| Render/keyboard         | Chromium 1280×900 ба 390×844; meaningful content/title, framework overlay/runtime error үгүй; хэвтээ overflow үгүй; keyboard focus; screenshot-уудыг нээж шалгасан                                                                                                                                                   |
| Console                 | Fixture-ийн зориудын network/HTTP алдаанаас 13 resource console error; тайлбарлагдаагүй error/warning 0, pageerror 0                                                                                                                                                                                                 |
| `test:integration`      | 1/1 PASS: тусдаа tmpfs campusfind_test; migration, auth/verify/lock, posts, blocked session, logout                                                                                                                                                                                                                  |
| Бодит API/browser       | PASS: login cookie → LOST → FOUND/GUARD → list/detail/reload → search/upload жинхэнэ 501 → retry-д post давхардаагүй → logout/session revoke                                                                                                                                                                         |
| `git diff --check`      | PASS                                                                                                                                                                                                                                                                                                                 |

Screenshot нотолгоо нь repo-оос гадна QA_OUTPUT_DIR: `desktop.png`, `mobile.png`, `mobile-form.png`, `upload-success.png`; тестийн зохиомол public өгөгдөл, 1px PNG ашигласан, бодит backend-ийн upload амжилт гэж ойлгохгүй.

Үлдсэн хязгаарлалт:

- Upload/search/filter амжилттай серверийн интеграц нь planned API/query/storage ба photo discovery contract-оос хамаарна. Реал 501 шалгасан; амжилт, race, partial upload нь fixture.
- Файлын сонголт/амжилттай upload ID нь тухайн хуудасны санах ойд. Reload/401 redirect хийвэл үлдсэн файл сонголт алдагдана; UI тайлбарлана. localStorage-д файл/token/зохиомол backend хадгалаагүй.
- Upload серверт хадгалагдсан ч response тасарсан тохиолдлыг client дангаар exactly-once болгох боломжгүй. Idempotency key/dedup contract-ийг Нармандах/Амарболд тохирох шаардлагатай. HTTP амжилт батлагдсан файлыг retry хийхгүй.
- Шинэ SMTP delivery, шинэ Compose build, remote CI, бусад browser engine болон бодит төхөөрөмж шалгаагүй. Лаб 8-ын өмнөх бодит SMTP/Compose баталгааг тусдаа тайлангаар хадгална.
- Shared App/client өөрчлөлт, response/list/binary санал, CI script холболтыг баг review хийж, backend/query/storage дууссаны дараа нийт story acceptance-ийг батална.
