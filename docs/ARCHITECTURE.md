# Архитектур ба шийдвэрүүд

## Эх тайлангуудтай холбоо

| Эх материал                                           | Кодод буулгасан шийдвэр                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| Лаб 1–2: 15 story, 70 SP, F1–F8                       | `contracts`, `planning/delivery-plan.json`, функцийн модуль           |
| Лаб 3: US-01/02/04/07, 17 SP                          | Sprint 1-ийн зам ба эх implementation                                 |
| Лаб 4: 8 task, WIP 2+2                                | Task нь story-г орлохгүй; PR review-д 2-оос их зэрэг ажил татахгүй    |
| Лаб 5, 4–6-р хуудас: class/sequence/layered           | React, нэг NestJS сервер, PostgreSQL; User/Post/Chat/Message/Handover |
| Лаб 6: feature branch, тойрог review, conflict/revert | PR workflow, LF, shared-file owner, protected main заавар             |
| Лаб 7: Node 24, 15 тест, Actions                      | `labs/lab07` хэвээр; үндсэн аппын CI job нэмэгдсэн                    |

Тайланг эх баримт болгон ашигласан; Лаб 4-ийн симуляцийг жинхэнэ хөгжүүлэлт, Лаб 7-ын in-memory модулийг DB-тэй production service гэж үзээгүй. Хүлээлгэн өгч дууссан зарын database/API төлөв нь `CLOSED`; хүлээлгэн өгсөн шалтгаан болон хугацааг холбогдох талбарт хадгална.

## Давхарга ба хавтас

```text
frontend/src/features/       React UI, form, state
          ↓ HTTP JSON, session cookie
packages/contracts/src/     Shared input/output schema, route registry
          ↓
backend/src/modules/       Controller → Service → DbService
backend/src/common/        SessionGuard, error filter, security helpers
database/prisma/            PostgreSQL schema + reviewed migrations
```

Auth нь бүртгэл/session-ийг, Posts нь зар ба харагдацыг, Chat/Handover нь хоёр талын хувийн урсгалыг, Notification/Admin нь дэмжих үйлдлийг хариуцна. Модуль бусдын controller-ийг шууд дуудахгүй. Шаардлагатай service method-оо export/import хийж эсвэл transaction outbox event хэрэглэнэ. Нармандах үндсэн backend, Амарболд comments/admin backend-ийг тусдаа модульд бичнэ; Ирмүүн frontend-ийг нэгтгэнэ.

`packages/contracts` нь frontend/backend-ийн хоорондох цорын ганц DTO эх. Prisma model-ийг HTTP response болгон шууд `return` хийхгүй: passwordHash, бүтэн код, secretAnswerHash, email, session token алдагдана. `publicUser`, `postView` шиг ил whitelist projection ашиглана.

## Өгөгдлийн загвар

- User: email/studentCode unique; зөвхөн MEMBER/ADMIN role. Finder/Owner нь account role биш, тухайн зар/шилжүүлэгтэй холбоотой харилцаа.
- Лаб 5-ын abstract Post → LostPost/FoundPost-ыг нэг Post хүснэгт, `type` discriminator, хоёр тусдаа input schema/rule болгон хэрэгжүүлэв. SQL CHECK нь FOUND-д handoverMethod, GUARD-д guardLocation шаардана; LOST-д эдгээрийг хориглоно.
- Chat: FOUND post-ийн author = finder, claimantId = нөгөө оролцогч. `(postId, claimantId)` unique; exactly 2 оролцогчийг service дээр батална. Author өөрийн зар дээр чат нээхгүй. Чат үүсгэх давтан хүсэлтэд эхний удаа 201, байгаа чатыг 200-гаар буцааж болно; энэ өөрчлөлтийг contract PR-д эхлээд нэмнэ.
- Message: senderId нь session-ээс; client-ийн senderId хүлээн авахгүй. ChatId + createdAt + id дарааллаар хуудаслах, ижил timestamp-тайг id-аар тогтвортой эрэмбэлнэ.
- Handover: postId unique, ownerId/finderId өөр хүмүүс. Finder chatId-г сонгосноор owner нь **chat.claimantId**, client-ийн arbitrary ownerId биш. Secret байвал тухайн чатны claimVerifiedAt шаардана. Secret байхгүй эд зүйлд finder гараар нотолгоог шалгаад сонгоно.
- Confirmation: оролцогчийн session-ээс аль тал гэдгийг тогтооно. Post ACTIVE ба Handover мөрийг transaction/row lock-оор шинэчилнэ. Хоёр баталгаа бүрдсэн үед completedAt + post.status=CLOSED атомикаар хадгална. Давтан confirm нь өөрчлөлтгүй 200; өөр хүн 403/404.
- US-06 manual close: post CLOSED, closedReason=AUTHOR_ARCHIVED. Энэ нь “амжилттай буцаасан” handover биш; completedAt үүсгэхгүй. Дуусаагүй handover үүссэн үед manual close 409, эхлээд шилжүүлгийн урсгалаа шийднэ. CLOSED постыг устгахгүй.
- Secret answer: trim + NFKC + `toLocaleLowerCase('mn')` normalization дараа salted hash; нууц үгтэй адил сcrypt helper хэрэглэж болно. Хариу/hash-ийг response/log/event payload-д оруулахгүй. Асуулт зөвхөн хоёр талын chat endpoint-д харагдана.
- Photo: private storageKey; URL нь `/api/v1/photos/{photoId}`. File extension-оос гадна magic bytes/MIME шалгана, санамсаргүй storageKey, ≤3 зураг ба <5MB файлыг transaction/quota шалгалттай хадгална. HTML/SVG зөвшөөрөхгүй.
- Notification: хэрэглэгчийн preference хоёр тусдаа. `PostCreated`, `ChatMessageCreated`, `HandoverConfirmed` outbox event-ээс хувийн мэдээлэлгүй notification үүсгэнэ. Worker ≤1 минут тутам polling/retry хийж ≤5 минут зорилгыг хэмжинэ. Үүнийг одоогийн код ажиллаж байгаа мэт тооцохгүй.
- Report/AuditLog: админы шийдвэр, шалтгаан, actor, timestamp. Админ чатын агуулгыг автоматаар уншихгүй. Block нь account/session-ийг хязгаарлаж, тухайн зохиогчийн зарыг нийтлэг жагсаалтаас хасна.

## Давхарга ба owner-ийн тохиролцоо

| Хэрэглэгч            | Нийлүүлэгч             | Гэрээ                                                             | Owner                 |
| -------------------- | ---------------------- | ----------------------------------------------------------------- | --------------------- |
| React UI             | NestJS API             | contracts Zod/OpenAPI, cookie, error envelope                     | Ирмүүн ↔ Нармандах   |
| Comments/Admin UI    | Comments/Admin API     | Ижил API client/guard                                             | Ирмүүн ↔ Амарболд    |
| API services         | database package       | Prisma client/type, searchWhere/filtersWhere, typed pending error | Нармандах ↔ Амарболд |
| Upload controller    | FileStore adapter      | save/read/remove, storageKey, mimeType, bytes                     | Нармандах ↔ Амарболд |
| Notification service | SMTP/worker deployment | outbox, env, retry/health                                         | Нармандах ↔ Амарболд |

Database package нь NestJS импортлохгүй. DataFeaturePendingError-ийг backend 501 болгоно. Frontend зөвхөн contracts ба HTTP client хэрэглэнэ. DB query/index-ийг backend-д хуулж давхар хадгалахгүй.

## Тохиргоо ба аюулгүй байдлын хил

Session нь 32-byte random opaque token; DB-д зөвхөн SHA-256 fingerprint. Browser cookie нь HttpOnly, SameSite=Lax; production-д Secure. Login/register-д process-local IP throttle, account дээр 5 алдаа/10 минут lock. Олон API instance ажиллуулахын өмнө rate-limit storage-г хуваалцах ёстой. Password нь salted scrypt. User role, senderId, authorId, verifiedAt-г client-ээс хүлээн авахгүй.

Бүх mutation `X-CampusFind: web` ба тохируулсан Origin шаардлагатай; Origin-гүй HTTP client зөв header/cookie-тэй ажиллаж болно. Server body validation strict тул нэмэлт талбар 400. Full API docs нь зөвхөн development-д нээлттэй. Production deployment, reverse proxy/HTTPS, persistent mail queue, backup restore, observability, upload malware хяналтыг тусдаа deployment ажлаар хийнэ; локал compose-г шууд нийтэд тавихгүй.

## DB өөрчлөх дараалал

1. Schema өөрчлөх issue ба shared PR нээнэ; өөр хүн migration үүсгэж байгаа эсэхийг Daily-д шалгана.
2. Latest main-аас schema edit → `db:migrate -- --name short_name`. SQL-ийг уншиж data loss байгаа эсэхийг review хийнэ.
3. `schema.prisma` болон **шинэ** migration directory-г нэг commit/PR-д оруулна. Нэгэнт main-д орсон migration-ийг засахгүй; нэмэлт migration үүсгэнэ.
4. Schema PR main-д орсны дараа feature branch-ууд `git merge origin/main`, `db:generate`, `db:deploy` ажиллуулна.
5. Амарболд schema/migration-ийг эзэмшинэ; Нармандах business constraint, Ирмүүн UI/API-д нөлөөлөх field өөрчлөлтийг review хийнэ.

Албан ёсны лавлах: [Nest modules](https://docs.nestjs.com/modules), [Prisma migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production), [Vite](https://vite.dev/guide/).
