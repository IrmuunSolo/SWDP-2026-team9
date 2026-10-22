# 8–9-р долоо хоног — Frontend ажлыг хүлээлгэн өгөх заавар

**Хариуцагч:** Л.Ирмүүн — frontend/PO; Г.Нармандах — backend/SM; Э.Амарболд — database/DevOps. Энэ баримт нь US-01/US-02-ын frontend хэрэгжилт дээр үргэлжлүүлж, бодит API, PostgreSQL, SMTP-тай нэгтгэн шалгах заавар юм.

## Одоогийн төлөв

| Хэсэг                | Төлөв                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend             | Нүүр хуудас, layout, register/verify/login/logout, session төлөв хэрэгжсэн; browser QA хийсэн                                            |
| Backend              | Register/verify/login/logout/me, домэйн, password hash, session, lockout-ийн суурь код бий; шинээр давхар auth модуль бичих шаардлагагүй |
| Database/DevOps      | Prisma schema, анхны migration, local seed, PostgreSQL/Mailpit Compose, CI workflow бий                                                  |
| Хамтарсан acceptance | Бодит DB/SMTP урсгал болон JWT интеграцыг баг үргэлжлүүлж баталгаажуулна                                                                 |

Frontend-ийн fixture-тэй шалгалт нь бодит серверийн хамгаалалт болон өгөгдөл хадгалалтыг батлахгүй. US-01/US-02-ыг бүхэлд нь Done болгохын өмнө доорх хамтарсан шалгалтыг дуусгана.

## Хэрэгжсэн frontend код

Кодыг энд давхар хуулахгүй; холбоосоор эх файл руу орж уншина. Доорх бүх frontend файлын үндсэн хариуцагч Ирмүүн.

| Файл                                                               | Үүрэг, үргэлжлүүлэхдээ анхаарах зүйл                                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [App.tsx](../frontend/src/App.tsx)                                 | Header/footer, navigation, `/users/me` bootstrap, guest/member/loading/error, logout, expired-session. Шинэ page холбоход route болон auth gate-ийг энд тохируулна |
| [HomePage.tsx](../frontend/src/features/home/HomePage.tsx)         | Нийтэд нээлттэй танилцуулга, ашиглах 3 алхам, native details/summary FAQ. Бодит зарын өгөгдөл татдаггүй                                                            |
| [AuthPage.tsx](../frontend/src/features/auth/AuthPage.tsx)         | Register/Login form, shared schema validation, давтан нууц үг, pending, и-мэйл шалгах төлөв; VerifyPage нь URL fragment дахь token-ийг explicit click-ээр илгээнэ  |
| [Feedback.tsx](../frontend/src/features/auth/Feedback.tsx)         | API error code → Монгол тайлбар; requestId байвал дэмжлэгийн дугаар харуулна                                                                                       |
| [api/client.ts](../frontend/src/api/client.ts)                     | Route registry-аар хүсэлт үүсгэж, cookie/CSRF header дамжуулна; response schema шалгана. `login`, `me`-ээс бусад API 401 буцаавал expired-session event үүсгэнэ    |
| [styles.css](../frontend/src/styles.css)                           | Layout, form, homepage, FAQ, responsive болон keyboard focus загвар                                                                                                |
| [PostsPage.tsx](../frontend/src/features/posts/PostsPage.tsx)      | `/posts` жагсаалт. Зар харах/үүсгэх суурь UI; хайлт/шүүлтүүр нь 10–11-р долоо хоногийн ажил                                                                        |
| [PostForm.tsx](../frontend/src/features/posts/shared/PostForm.tsx) | LOST/FOUND форм; createPost амжилтад `/posts` руу шилжинэ                                                                                                          |
| [Shared contracts](../packages/contracts/src/index.ts)             | registerSchema, loginSchema, verifySchema, PublicUser, API route/input/output-ийн нэгдсэн эх; өөрчлөлтийг хамтарсан PR-аар review хийнэ                            |

| Browser зам                           | Хандалт ба үйлдэл                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `/`                                   | Нийтэд нээлттэй; backend холбогдохгүй үед ч танилцуулга харагдана                   |
| `/register`, `/login`                 | Guest form; нэвтэрсэн хэрэглэгчийг `/posts` руу шилжүүлнэ                           |
| `/verify-email#TOKEN`                 | И-мэйл холбоос; token байхгүй/буруу бол submit хийхгүй; амжилтад fragment цэвэрлэнэ |
| `/posts`                              | Session-тэй хэрэглэгчийн зарууд; guest-д нэвтрэх заавар харуулна                    |
| `/posts/new/lost`, `/posts/new/found` | Session-тэй хэрэглэгчийн форм; нийтэлсний дараа `/posts`                            |

Login амжилт → `/posts`; reload → `me`-ээр user сэргээнэ; logout → `/login`; хувийн API 401 → `/login?reason=session-expired`. Брэнд болон «Нүүр» холбоос `/` руу буцна.

## Нармандахын үргэлжлүүлэх ажил — Backend

1. [AuthController](../backend/src/modules/auth/auth.controller.ts), [AuthService](../backend/src/modules/auth/auth.service.ts), [MailService](../backend/src/modules/auth/mail.service.ts), [SessionGuard](../backend/src/common/session.ts)-ыг уншиж, доорх гэрээтэй тулгана. Байгаа суурийг үргэлжлүүлэн засна.
2. [config.ts](../backend/src/config.ts), root `.env`-ийн `UNIVERSITY_EMAIL_DOMAINS`, `WEB_ORIGIN`, SMTP тохиргоог Амарболдтой тааруулна. Домэйныг сервер шалгана; frontend-д жагсаалтыг давхар hardcode хийхгүй.
3. Бодит register → SMTP → verify урсгалыг шалгана. Захианы холбоос `WEB_ORIGIN/verify-email#TOKEN` байна; query string эсвэл raw token response болгож өөрчлөхгүй. Token нэг удаагийн, 24 цагийн хугацаатай байна.
4. Буруу credential, баталгаажаагүй/blocked хэрэглэгч, 5 оролдлогын 10 минутын lock, logout/revocation болон expired session-ийг сервер дээр батална. Алдаа нь frontend-ийн хүлээж буй code-той байна.
5. [JWT төлөвлөгөө](AUTH_JWT_PLAN.md)-ийн дагуу тусдаа PR хийнэ. Одоогийн auth нь opaque session; JWT бэлэн гэж тэмдэглэхгүй. Controller, guard, session/jti schema, fixture/test-үүдийг хамтад нь шинэчилнэ. Schema өөрчлөлтийг Амарболдтой, UI нөлөөг Ирмүүнтэй review хийнэ.
6. [HTTP/unit тест](../backend/test/unit/http.test.ts), [security тест](../backend/test/unit/security.test.ts), [DB integration тест](../backend/test/integration/database.test.ts)-ийг шинэ нөхцөлөөр баталгаажуулна.

### Frontend-ийн хүлээж буй API гэрээ

Бүх зам `/api/v1` prefix-тэй. Frontend `/api/v1/...` руу хүсэлт явуулж Vite proxy ашиглана. Дэлгэрэнгүй schema: [API.md](API.md), [OpenAPI](api/openapi.json).

| Method ба зам             | Request body                                  | Хүлээх хариу                                                                |
| ------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| POST `/auth/register`     | `{displayName, studentCode, email, password}` | 202 `{data:{message}}`; login/session үүссэн гэж тооцохгүй                  |
| POST `/auth/verify-email` | `{token}`                                     | 200 `{data:{message}}`                                                      |
| POST `/auth/login`        | `{email, password}`                           | 200 `{data:{user}}` + HttpOnly session cookie; UI `/posts` руу шилжинэ      |
| GET `/users/me`           | Байхгүй                                       | 200 `{data:user}`; session байхгүй/дууссан бол 401                          |
| POST `/auth/logout`       | Байхгүй                                       | 200 `{data:{message}}`; серверийн session хүчингүй болж cookie цэвэрлэгдэнэ |

`user` нь `{id, displayName, studentCodeMasked, role}`; `role` нь `MEMBER` эсвэл `ADMIN`. И-мэйл, бүтэн оюутны код, password hash, raw session token-ийг энэ object-д нэмэхгүй. Давтан нууц үг зөвхөн UI-ийн шалгалт; register body-д илгээгддэггүй.

POST хүсэлтүүд `Content-Type: application/json`, `X-CampusFind: web` header-тай. Бүх хүсэлт `credentials: include` ашиглана. Одоогийн cookie нэр `campusfind_session`, HttpOnly, SameSite=Lax; production-д Secure. Token-ийг localStorage-д хадгалахгүй.

Алдааны envelope: `{error:{code,message,requestId,details?}}`.

| HTTP / code                         | Frontend-ийн хариу үйлдэл                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| 400 `UNIVERSITY_EMAIL_REQUIRED`     | И-мэйл талбарт сургуулийн хаяг шаардана                                               |
| 400 `VALIDATION_ERROR`              | API-ийн message-ийг харуулна; frontend-ийн талбарын validation shared schema ашиглана |
| 400 `INVALID_TOKEN`                 | Verification алдааг харуулж, дахин хүсэлт авах заавар үзүүлнэ                         |
| 401 `INVALID_CREDENTIALS`           | И-мэйл эсвэл нууц үг буруу гэж харуулна                                               |
| 401 `UNAUTHENTICATED`               | `me` дээр guest төлөв; бусад хувийн API дээр expired-session шилжилт                  |
| 403 `ACCOUNT_UNAVAILABLE`           | Баталгаажсан, идэвхтэй бүртгэл шаардах тайлбар                                        |
| 429 `LOGIN_LOCKED`                  | 10 минутын тайлбар; сервер үлдсэн хугацаа өгөөгүй тул countdown байхгүй               |
| 503 `MAIL_UNAVAILABLE`, бусад алдаа | Серверийн message, requestId; form утгаа хадгалж дахин оролдоно                       |

API зам, envelope, error code эсвэл cookie дамжуулах аргыг өөрчлөх бол contract ба frontend-ийг эхэлж тохирно. Зөвхөн JWT болсон шалтгаанаар UI-д token тайлах, Bearer/localStorage урсгал нэмэхгүй.

## Амарболдын үргэлжлүүлэх ажил — Database, DevOps

1. [Compose](../devops/compose.yaml)-оор PostgreSQL 17, Mailpit-ийг бэлдэнэ. Root [.env.example](../.env.example)-аас өөрийн `.env` үүсгэж `DATABASE_URL`, `WEB_ORIGIN`, сургуулийн домэйн, SMTP утгуудыг backend-тэй тааруулна. Нууц тохиргоог commit хийхгүй.
2. [schema.prisma](../database/prisma/schema.prisma), [migration-ууд](../database/prisma/migrations/)-ыг шалгаж `db:generate`, `db:deploy` ажиллуулна. User, VerificationToken, Session хадгалалт auth service-тэй нийцэж байгааг Нармандахтай тулгана. Одоо байгаа migration-ийг дахин бичихгүй; шинэ schema өөрчлөлтөд шинэ migration нэмнэ.
3. Шууд login турших бол [local seed](../database/src/seed.ts)-ийг зориуд ажиллуулна. Seed нь verified MEMBER-үүд, 2 жишиг зар үүсгэнэ; existing password-ийг солихгүй. Энэ нь register/SMTP/verify acceptance-ийг орлохгүй.
4. [Foundation workflow](../.github/workflows/foundation.yml)-ийн PostgreSQL service, migration болон integration job-ийг PR дээр шалгана. [Лаб 7 CI](../.github/workflows/ci.yml)-г хадгална. `campusfind_test` гэсэн тусдаа DB-ээр integration тест ажиллуулна; development өгөгдлийн санг reset/truncate хийхгүй.
5. JWT-д jti/revocation schema хэрэгтэй бол Нармандахтай migration PR нэгтгэнэ. [database README](../database/README.md), [DevOps README](../devops/README.md), ажиллуулах зааврыг бодит үр дүнгээр шинэчилнэ.

## Ирмүүний үргэлжлүүлэх ажил — Frontend, PO

API-ийн contract өөрчлөлтийг UI-тай тулгаж review хийнэ. Fixture-ийг бодит backend-тэй сольж form, error, session, navigation-аа browser дээр дахин шалгана. Шинэ page нэмэхдээ `App.tsx`-ийн route/auth gate, document title, navigation-ийг хамт шинэчилнэ. 10–11-р долоо хоногийн upload/search/filter UI-г [хуваарь](DELIVERY_PLAN.md)-ийн дагуу үргэлжлүүлнэ; planned API-г fake success болгож өөрчлөхгүй.

## Нэгтгэх дараалал ба branch

1. Энэ frontend өөрчлөлт `main`-д нэгтгэгдсэний дараа гишүүд latest main-аа авна. Хамааралтай PR хараахан merge болоогүй бол өөрийн PR-ийг Draft байлгаж dependency-г тэмдэглэнэ.
2. Амарболд DB/SMTP орчныг бэлдэж, readiness болон migration үр дүнг хуваалцана.
3. Нармандах бодит API урсгалаа шалгана; schema/contract өөрчлөлтийн PR-ийг dependent UI ажлаас өмнө нэгтгэнэ.
4. Ирмүүн бодит frontend урсгалаар acceptance хийж, Нармандах API, Амарболд DB/CI үр дүнг хамт батална.

Цэвэр working tree дээр repo root-оос:

```powershell
git switch main
git pull --ff-only origin main
# Нармандахын жишээ; Амарболд feat/w08-09-auth-database-ci ашиглаж болно.
git switch -c feat/w08-09-backend-auth-integration
npm.cmd ci
npm.cmd run db:generate
```

Файлын эзэмшлийг мөрдөж, холбогдох owner-оор review хийлгэнэ. Commit/push, PR, conflict шийдвэрлэх бүрэн дараалал: [CONTRIBUTING.md](CONTRIBUTING.md). Өөрчлөлттэй working tree дээр switch/pull хийхийн өмнө одоогийн ажлаа commit эсвэл stash хийнэ.

## Бодит орчныг бэлдэх

Node.js 24, npm 11, ажиллаж буй Docker Desktop шаардлагатай. Бүх командыг repo root-оос ажиллуулна:

```powershell
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# .env-ийн домэйн, WEB_ORIGIN, DATABASE_URL, SMTP тохиргоог тулгана.
npm.cmd run db:generate
npm.cmd run infra:up
npm.cmd run db:deploy
npm.cmd run build
```

Хоёр terminal дээр тус тус `npm.cmd run dev:api`, `npm.cmd run dev:web` ажиллуулна. Веб `http://localhost:5173`, readiness `http://localhost:3000/api/v1/health/ready`, Mailpit `http://localhost:8025`. Cookie/origin зөрөхөөс сэргийлж browser дээр localhost хэрэглэнэ. Суурилуулалт ба алдаа засах: [SETUP.md](SETUP.md).

Шууд нэвтрэх local fixture хэрэгтэй бол:

```powershell
$env:SEED_DEMO_PASSWORD = "local-only-demo-123"
npm.cmd run db:seed
Remove-Item Env:SEED_DEMO_PASSWORD
```

`owner@example.edu`, `finder@example.edu`, `visitor@example.edu` бүртгэлүүд энэ нууц үгээр анх үүснэ. Өмнө үүссэн хэрэглэгчийн нууц үг өөрчлөгдөхгүй. Production-д энэ seed-ийг хэрэглэхгүй.

## Хамтарсан acceptance — Done болгохын өмнө

| Шалгах урсгал                                  | Хүлээх үр дүн                                                                                             | Баталгаажуулах гишүүд |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------- |
| Guest `/`, FAQ mouse/Enter                     | Нүүр харагдана; асуулт нээгдэж/хаагдана; API unavailable үед ч танилцуулга үлдэнэ                         | Ирмүүн                |
| Guest `/posts`, post-create route              | Хувийн жагсаалт/форм харагдахгүй; нэвтрэх эсвэл холболтын алдааны заавар                                  | Ирмүүн, Нармандах     |
| Буруу код, и-мэйл, богино/зөрүүтэй нууц үг     | Талбарын алдаа; API хүсэлт үүсэхгүй                                                                       | Ирмүүн                |
| Сургуулийн бус домэйн                          | Сервер 400 UNIVERSITY_EMAIL_REQUIRED; и-мэйл талбарын алдаа                                               | Нармандах, Ирмүүн     |
| Шинэ бүртгэл → Mailpit → verify                | Захиа бодитоор ирнэ; холбоосоор explicit click; emailVerifiedAt хадгалагдана; login автоматаар хийгдэхгүй | Гурвуулаа             |
| Token дахин ашиглах/хугацаа дуусах             | Сервер татгалзана; UI алдаа, дахин хүсэлт авах заавар                                                     | Нармандах, Ирмүүн     |
| Login → `/posts` → reload                      | Session cookie дамжина; DB session хүчинтэй; masked user ба жагсаалт сэргээнэ                             | Гурвуулаа             |
| 5 удаа буруу login, хугацааны дараах оролдлого | Сервер 10 минут түгжинэ; UI LOGIN_LOCKED тайлбар; хугацаа дуусахад зөв login боломжтой                    | Нармандах, Ирмүүн     |
| Logout → хуучин session-ээр дахин API дуудах   | Session хүчингүй, 401; UI `/login`                                                                        | Нармандах, Ирмүүн     |
| Blocked/expired хэрэглэгч                      | Сервер 403/401; private агуулга нээлттэй үлдэхгүй                                                         | Нармандах, Ирмүүн     |
| UI/API integration ба CI                       | 1280px/390px, keyboard, console/overflow; unit болон isolated DB integration амжилттай                    | Гурвуулаа             |

«Захиа илгээх хүсэлт хүлээн авлаа» гэсэн UI нь SMTP хүргэлтийг өөрөө батлахгүй. SMTP-г Mailpit inbox-оор шалгана. Integration тест нь MailService-ийг capture fixture-ээр орлуулдаг тул бодит SMTP шалгалт мөн тусдаа шаардлагатай.

```powershell
npm.cmd run check
npm.cmd test
git diff --check
```

`npm.cmd run test:integration`-ийг тусдаа test DB, шаардлагатай env-ийг [TESTING.md](TESTING.md)-ийн дагуу бэлдсэний дараа ажиллуулна. PR-д migration/contract өөрчлөлт, ажиллуулсан команд ба үр дүн, бодит browser нотолгоо, ажиллуулаагүй шалгалт болон шалтгааныг бичнэ. Тестийн password/token, cookie, SMTP credential-ийг нотолгоонд оруулахгүй.

## Хүлээлгэн өгөх үеийн QA нотолгоо — 2026-10-22

- `npm run check` амжилттай; API/unit 25 + Лаб 7 regression 15 тест амжилттай.
- Auth UI: Edge + Playwright, 1280×900 / 390×844; validation, register/verify/login/logout, 401/403/429/network/HTML error, bootstrap retry, expired-session, keyboard. Runtime болон тайлбарлагдаагүй console алдаа илрээгүй.
- Homepage: built-in browser, 1280×900 / 390×844 / үндсэн 703px; guest/member нүүр, anchor, FAQ mouse/Enter, guest gate, login → `/posts`, зар үүсгэх → `/posts`, logout шалгагдсан; overflow/overlay илрээгүй.
- Verification fragment солигдоход token/UI шинэчлэгдэж, хуучин хүсэлтийн хариу шинэ төлөвийг дарж бичихгүй.
- Browser auth/зар үүсгэх шалгалтууд түр API fixture ашигласан. Бодит PostgreSQL, SMTP, серверийн lock болон JWT интеграцыг дээрх acceptance-аар баг үргэлжлүүлж батална. Remote CI-ийн үр дүнг тухайн PR-ийн Actions дээр шалгана.
