# API гэрээ ба хандах эрх

Base URL: `http://localhost:3000/api/v1`. Browser → same-origin `/api/v1`; Swagger: `http://localhost:3000/docs`. 34 бизнес API замын хүснэгт [routes.md](api/routes.md), request/response schema ба status нь [openapi.json](api/openapi.json)-д байна. Эх файл `packages/contracts/src/index.ts`.

Үйлчилгээний нэмэлт PUBLIC замууд: `GET /health` → `{data:{status:"ok"}}`, `GET /health/ready` → `{data:{status:"ready"}}`; DB холбогдохгүй бол readiness 503. Эдгээр нь бизнесийн 34 замаас тусдаа.

## Нэгдсэн формат

- JSON field camelCase; ID UUID v4; enum uppercase; цаг ISO 8601 UTC; occurredOn нь `YYYY-MM-DD`, цагийн бүсгүй календарийн огноо.
- Амжилт: `{ "data": ... }`. Жагсаалт: `{ "data": { "items": [], "meta": { "page": 1, "pageSize": 20, "total": 0 } } }`.
- Posts page ≥1, pageSize 1–50, default 20; stable createdAt DESC, id DESC. Идэвхтэй, блоклогдоогүй author-ийн постууд л нийтлэг жагсаалтад орно.
- 12–13-р долоо хоногийн message/notification/comment/report жагсаалт `after` UUID cursor, `limit` ≤50 (default20) хэрэглэнэ. Одоогийн planned output нь array; cursor-ийн `nextCursor` шаардвал contract-д эхэлж envelope нэмээд frontend/backend-тэй нэг PR-д шинэчилнэ. Одоохондоо pagination implemented гэж үзэхгүй.
- Алдаа: `{ "error": { "code": "VALIDATION_ERROR", "message": "Оруулсан өгөгдөл буруу", "requestId": "uuid", "details": [{ "path": ["title"], "message": "..." }] } }`.
- `X-Request-Id` header ба error.requestId-гаар алдааг холбож шалгана. Request body/password/token-ийг log-д бичихгүй.

| HTTP | Утга                                                 |
| ---- | ---------------------------------------------------- |
| 200  | Унших/өөрчлөх/гарах/баталгаажуулах амжилт            |
| 201  | Шинэ resource                                        |
| 202  | Бүртгэл хүлээн авсан; и-мэйлийг шалгана              |
| 400  | Body/query/path validation, token invalid            |
| 401  | Session байхгүй/хугацаа дууссан, буруу нэвтрэлт      |
| 403  | Блоклогдсон/баталгаажаагүй, эрхгүй, CSRF             |
| 404  | Resource байхгүй эсвэл тухайн хүнд харагдахгүй       |
| 409  | Unique/state conflict, аль хэдийн өөр owner сонгосон |
| 429  | Login/claim/IP request limit                         |
| 501  | Гэрээ бэлэн, тухайн функц хэрэгжээгүй                |
| 503  | DB/SMTP түр боломжгүй                                |
| 500  | Серверийн дотоод алдаа; internal stack/SQL буцаахгүй |

## Эрхийн дүрэм

| Access      | Дүрэм                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------- |
| PUBLIC      | register/verify/login болон health; session хэрэггүй, mutation CSRF header шаардлагатай  |
| MEMBER      | Session valid, email verified, blockedAt=null. ADMIN ч member-level урсгал ашиглаж болно |
| AUTHOR      | Дээрх + post.authorId === req.user.id                                                    |
| FINDER      | Дээрх + post.type=FOUND, post.authorId === req.user.id                                   |
| PARTICIPANT | Дээрх + chat/handover-ийн хоёр бодит оролцогчийн нэг; ADMIN нь дан role-оор нэвтрэхгүй   |
| ADMIN       | role=ADMIN; өөрийн role-г registration/update body-оор өөрчлөхгүй                        |

`ready` замууд session/body validation-тай ажиллана. `planned` замууд session, admin role-г шалгаад 501 буцаадаг reservation; resource-ийн AUTHOR/PARTICIPANT/FINDER бодит шалгалтыг implement хийх story-ийн service дээр нэмнэ. 501 нь “эрхтэй нь батлагдсан” гэсэн үг биш. Planned route-г ready болгохын өмнө 401,403/404,200/201 тест бүр зайлшгүй.

## Одоогийн суурийн request response жишээнүүд

Бүх POST/PATCH/DELETE: `Content-Type: application/json`, `X-CampusFind: web`; session авсан бол cookie дамжуулна. Authorization Bearer, localStorage token ашиглахгүй. Swagger UI cookie-г browser автоматаар дамжуулна; header талбарыг `web` гэж бөглөнө.

### Бүртгүүлэх

`POST /auth/register` → 202

```json
{
  "displayName": "Оюутан",
  "email": "student@example.edu",
  "studentCode": "B232270021",
  "password": "long-local-password"
}
```

```json
{ "data": { "message": "Шаардлага хангасан бүртгэлд баталгаажуулах и-мэйл илгээнэ" } }
```

`POST /auth/verify-email` body `{ "token": "64-character-hex" }` → 200 message. Raw verification token response-д ирэхгүй; Mailpit/SMTP холбоосоос авна. Register амжилт нь login хийгдсэн гэсэн үг биш.

### Нэвтрэх ба гарах

`POST /auth/login` body `{ "email": "student@example.edu", "password": "long-local-password" }` → 200 + `Set-Cookie: campusfind_session=...; HttpOnly; SameSite=Lax`.

```json
{
  "data": {
    "user": {
      "id": "11111111-1111-4111-8111-111111111111",
      "displayName": "Оюутан",
      "studentCodeMasked": "B23****",
      "role": "MEMBER"
    }
  }
}
```

`GET /users/me` → data нь дээрх user object. `POST /auth/logout` → 200 message; DB session устаж, өмнөх cookie хүчингүй болно. blockedAt-г guard хүсэлт бүрд DB-ээс шалгана.

### LOST/FOUND үүсгэх

`POST /posts` → 201. AuthorId нь session-ээс; body-д оруулахгүй.

```json
{
  "type": "LOST",
  "title": "Түлхүүр",
  "description": "Ногоон оосортой",
  "category": "KEYS",
  "location": "LIBRARY",
  "occurredOn": "2026-10-01"
}
```

```json
{
  "type": "FOUND",
  "title": "Түлхүүр олсон",
  "description": "Номын сангийн үүдэнд",
  "category": "KEYS",
  "location": "LIBRARY",
  "occurredOn": "2026-10-01",
  "handoverMethod": "GUARD",
  "guardLocation": "MAIN"
}
```

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "author": {
      "id": "11111111-1111-4111-8111-111111111111",
      "displayName": "Оюутан",
      "studentCodeMasked": "B23****",
      "role": "MEMBER"
    },
    "type": "FOUND",
    "status": "ACTIVE",
    "title": "Түлхүүр олсон",
    "description": "Номын сангийн үүдэнд",
    "category": "KEYS",
    "location": "LIBRARY",
    "occurredOn": "2026-10-01",
    "handoverMethod": "GUARD",
    "guardLocation": "MAIN",
    "createdAt": "2026-10-20T00:00:00.000Z"
  }
}
```

MEET үед guardLocation байхгүй. LOST үед handoverMethod/guardLocation оруулахгүй. Дараах Category: ELECTRONICS/DOCUMENTS/KEYS/CLOTHING/OTHER. Байрны жишиг код: MAIN/BUILDING_1/BUILDING_2/LIBRARY. Ирээдүйн occurredOn 400. `description`-ийг одоогийн гэрээнд хоосон зөвшөөрөхгүй; шаардлагыг багтай өөрчлөх бол shared PR.

`GET /posts?page=1&pageSize=20` → data.items + data.meta. `GET /posts/{postId}` → нэг post. `q` болон filter параметр одоогоор 501, 10–11-р долоо хоногийн ажил.

## Дараагийн долоо хоногуудын API гэрээ

Доорх хүсэлтүүд одоогоор 501. Амжилттай response-ийн бүх талбар, бусад замыг OpenAPI-аас үзнэ.

| Үйлдэл                                     | Request                                                | Success data                                                                               |
| ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `POST /chats`                              | `{ "postId": "uuid" }`                                 | `{id,postId,participants:[UserView,UserView],createdAt}`                                   |
| `POST /chats/{chatId}/messages`            | `{ "body": "Хаана уулзах вэ?" }`                       | `{id,chatId,senderId,body,createdAt}`                                                      |
| `PATCH /posts/{postId}/secret`             | `{ "question": "Оосрын өнгө?", "answer": "ногоон" }`   | `{message}`; хариу/hash хэзээ ч буцахгүй                                                   |
| `POST /chats/{chatId}/verify-claim`        | `{ "answer": "ногоон" }`                               | `{verified:true}`; буруу хариу generic 400, limit 429                                      |
| `POST /posts/{postId}/owner`               | `{ "chatId": "uuid" }`                                 | `{id,postId,ownerId,finderId,ownerConfirmed:false,finderConfirmed:false,completedAt:null}` |
| `POST /handovers/{handoverId}/confirm`     | body байхгүй                                           | Handover; хоёр тал баталсан бол completedAt ба post CLOSED                                 |
| `PATCH /users/me/notification-preferences` | `{ "inApp":true,"email":false }`                       | Тохируулсан хоёр утга                                                                      |
| `PATCH /admin/reports/{reportId}`          | `{ "action":"HIDE_POST","reason":"Зөрчлийн тайлбар" }` | Report + audit side effect                                                                 |
| `PATCH /admin/users/{userId}/block`        | `{ "blocked":true,"reason":"Шалтгаан" }`               | `{message}` + sessions revoked                                                             |

Зураг upload нь multipart/form-data `file`, GET photo нь binary JPG/PNG. Бусад жишээний JSON envelope-г зураг download-д хүчээр хэрэглэхгүй.

## API гэрээг өөрчлөх

1. Issue дээр route id, input/output, permission, status-ийн өөрчлөлтөө тайлбарла.
2. `packages/contracts/src/index.ts` schema/route-ийг зас.
3. `npm.cmd run contract:generate`; generated `docs/api/openapi.json`, `routes.md`-ийг хамт commit.
4. Frontend/backend consumer-ийг хамт typecheck, permission test, backwards compatibility шалга. Shared PR-ийг нэгтгээд feature owner-ууд main-аа шинэчилнэ.
5. Шинэ module controller-ийг `AppModule`-д **PlannedModule-ийн өмнө** холбоно. Contract.status=ready болгон success ба object-authorization test нэмнэ.

Frontend API adapter route.path/method/output validation-ийг эндээс уншдаг. Шинэ backend input-ийг `parse(schema, body/query/params)`-аар шалгана. Contract.status солих нь server method автоматаар үүсгэхгүй.

## Давхаргын эзэмшил ба хуваарь

Generated хүснэгт/OpenAPI дахь owner нь API controller/service-ийн эзэн. Comments/Admin — Амарболд, бусад API — Нармандах. frontendOwner=irmuun, dataOwner=amarbold, weekBlock=8-9/10-11/12-13. Энэ нь DB query-г API owner өөрөө бичих ёстой гэсэн үг биш; backend нь database package-ийн гэрээгээр холбогдоно.

Зурагт JWT төлөвлөсөн боловч одоогийн session transport хэвээр. JWT PR гаргахдаа AUTH_JWT_PLAN-ийг дагаж OpenAPI security scheme ба guard/test-ийг хамт шинэчилнэ.
