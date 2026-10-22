# 8–9-р долоо хоног — Frontend: Суурь + Auth

Хариуцагч: **Л.Ирмүүн**. Хамрах хүрээ: React layout, бүртгүүлэх/нэвтрэх, и-мэйл баталгаажуулах UI, US-01/US-02 acceptance. Backend — Нармандах; database/CI — Амарболд.

## Хэрэгжүүлэх төлөвлөгөө

| Дараалал | Ажил                                  | Дууссан гэж үзэх нөхцөл                                                                                                                                                  |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1        | Нэгдсэн layout, navigation, auth gate | Desktop/mobile-д уншигдана; guest хамгаалагдсан хуудас ашиглахгүй; session шалгах үед хувийн агуулга харагдахгүй                                                         |
| 2        | Register form                         | Shared registerSchema ашиглана; нэр, и-мэйл, код, нууц үгийн алдаа талбарын дор; давтан нууц үг таарна; давхар хүсэлт илгээхгүй                                          |
| 3        | Verification UI                       | Бүртгэл нь login хийхгүй; холбоосыг и-мэйлээс нээж баталгаажуулна; дутуу/буруу/ашигласан холбоосын тайлбар, дахин оролдох боломжтой                                      |
| 4        | Login/logout/session                  | Зөв login нүүр рүү шилжинэ; reload-д me-ээр session сэргээнэ; буруу мэдээлэл, account unavailable, lock, network алдаа ялгаатай харагдана; logout pending/error төлөвтэй |
| 5        | Acceptance, QA                        | Keyboard, pending, алдаа, амжилт, desktop/mobile урсгалыг browser дээр шалгана; build болон regression тест амжилттай                                                    |

## API ба гишүүдийн хамаарал

Frontend бүх хүсэлтээ `src/api/client.ts`-ээр, cookie-г `credentials: include` тохиргоотой илгээнэ. Token-ийг localStorage-д хадгалахгүй.

| API                     | Frontend-ийн үйлдэл                                      | Backend-ийн хариуцах шалгалт                                     |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| POST /auth/register     | Shared schema validation → pending → и-мэйл шалгах төлөв | Сургуулийн домэйн, бүртгэл, verification и-мэйл                  |
| POST /auth/verify-email | Fragment дахь token-оор товч дарж баталгаажуулах         | Token зөв, хугацаатай, нэг удаагийн эсэх                         |
| POST /auth/login        | Form → error эсвэл нүүр хуудас                           | Credential, verified/blocked, 5 буруу оролдлогын 10 минутын lock |
| GET /users/me           | Ачаалах/дахин оролдох → guest эсвэл member layout        | Cookie/session хүчинтэй эсэх                                     |
| POST /auth/logout       | Pending → login; алдаанд retry                           | Серверийн session хүчингүй болгох                                |

Сургуулийн зөвшөөрсөн домэйныг frontend-д давхар hardcode хийхгүй. `UNIVERSITY_EMAIL_REQUIRED` хариуг и-мэйл талбарын алдаа болгоно. `LOGIN_LOCKED` үед 10 минутын тайлбар харуулна; серверээс үлдсэн хугацаа ирдэггүй тул зохиомол countdown харуулахгүй. JWT-г backend хэрэгжүүлэхэд cookie/request-response гэрээ хэвээр байвал frontend token боловсруулахгүй.

## US-01/US-02 acceptance checklist

- US-01: буруу оюутны код, нэр, и-мэйл, богино нууц үг болон давтан нууц үгийн зөрүү API хүсэлт үүсгэхгүй.
- US-01: сургуулийн бус домэйнд API-ийн татгалзлыг харуулна; form өгөгдөл хадгалагдаж засах боломжтой.
- US-01: register амжилтад и-мэйл шалгах заавар харагдана; session үүссэн гэж тооцохгүй.
- US-01: verification нь explicit click шаарддаг; token байхгүй/буруу үед хүсэлт явуулахгүй; success үед URL fragment цэвэрлэгдэнэ.
- US-02: буруу credential, 403 unavailable, LOGIN_LOCKED, 503/network алдаа ойлгомжтой харагдана. Алдааны requestId байвал дэмжлэгийн дугаар болгон харуулна.
- US-02: login success → нүүр; reload → masked user; logout → login; expired session → login.
- Layout: label, autocomplete, focus indicator, live status/error, keyboard submit; 390px болон desktop өргөнд хэвтээ overflow үүсэхгүй.

## Шалгалт

`npm run check`, `npm test`, `git diff --check`. Browser тестэд API fixture ашигласан үр дүн нь backend-ийн домэйн/lock дүрэм, PostgreSQL, SMTP-ийн бодит ажиллагааг батлахгүй. Бодит register → Mailpit → verify → login/logout урсгалыг [SETUP.md](SETUP.md), PostgreSQL тестийг [TESTING.md](TESTING.md)-ийн дагуу багийн интеграц дээр шалгана.

## Хэрэгжилтийн үр дүн — 2026-10-22

Төлөвлөгөөний frontend хэсгүүд хэрэгжсэн. `App.tsx` нь layout, guest/member/loading/error төлөв, session сэргээх/гарах/хугацаа дуусах урсгалыг хариуцна. `features/auth/AuthPage.tsx` нь shared schema validation, давтан нууц үг, pending, registration success, verification төлөвүүдтэй. `Feedback.tsx` нь API алдааны Монгол тайлбар; `api/client.ts` нь cookie/CSRF, буруу JSON хариу болон expired-session мэдэгдлийг хариуцна.

- `npm run check`: build, формат, 34 API гэрээ, төлөвлөгөө, давхаргын шалгалт амжилттай.
- `npm test`: API-ийн 25, Лаб 7-ын 15 тест амжилттай.
- Browser: локал `http://127.0.0.1:5182`, Edge + Playwright 1.62.1, 1280×900 болон 390×844. Browser plugin not available тул regular Playwright ашиглав.
- 11 бүлэг урсгал: guest gate; local validation; domain error/pending; SMTP error/retry/register success; verification missing/invalid/expired/success; login 401/403/429/network/HTML error; login/reload/redirect; bootstrap failure/retry; logout failure/success; expired-session; responsive/keyboard/404.
- Page title, хоосон дэлгэц/overlay, console, screenshot, interaction шалгалтууд амжилттай. Runtime болон тайлбарлагдаагүй console алдаа 0; зориуд үүсгэсэн 4xx/5xx/network failure-ийн browser log нь хүлээгдсэн.
- Keyboard Enter submit, Tab focus, POST хүсэлтийн `X-CampusFind` header шалгагдсан. localStorage хоосон; token хадгалаагүй.

QA-аар ижил verification хуудсанд өөр fragment-тай холбоос нээхэд token шинэчлэгдэхгүй байсныг илрүүлж зассан. Fragment солигдоход token/UI шинэчлэгдэж, өмнөх хүсэлтийн хариу шинэ холбоосын төлөвийг дарж бичихгүй.

Энэ нь US-01/US-02-ын **frontend** acceptance юм. Бодит PostgreSQL/SMTP урсгал, 5 оролдлогын серверийн lock, JWT болон бусад browser дээрх интеграцийн баталгаажуулалт үлдэнэ.
