# Багийн хөгжүүлэлтийг эндээс эхлэх

Багийн баталсан зурагт төлөвлөгөөний дагуу кодыг дөрвөн үндсэн хүрээнд тусгаарлав.

```text
frontend/              Ирмүүн — React UI, API client
backend/               Нармандах — NestJS API, business logic
  src/modules/comments/  Амарболд — Comments API
  src/modules/admin/     Амарболд — Admin/block API
database/              Амарболд — schema, migration, seed, query, storage
devops/                Амарболд — compose, deployment заавар
packages/contracts/    Хамтарсан — HTTP input/output, API owner/хугацаа
.github/workflows/     Амарболд — GitHub CI энд байх шаардлагатай
docs/                  Нэгдсэн заавар
```

## Унших дараалал

1. [Орчин суулгах](SETUP.md): нэг root `.env`, root npm командууд.
2. [8–15-р долоо хоногийн ажил](DELIVERY_PLAN.md): гишүүн бүрийн код, dependency, review.
3. [API гэрээ](API.md), [34 замын owner/хугацаа](api/routes.md).
4. [Branch → PR/MR](CONTRIBUTING.md), [тест/Done](TESTING.md).
5. [Архитектур](ARCHITECTURE.md), [GitHub settings](REPOSITORY_SETTINGS.md).

## Одоогийн хэрэгжүүлэлт

React auth/posts form, NestJS register/verify/login/logout/me, session cookie, post create/read, pagination, PostgreSQL schema/migration, health, Zod validation, API гэрээ ба CI бэлэн. Search/filter, chat, handover, upload, notification, moderation нь planned seam/501 хэвээр; кодын бүтэц солигдсон нь эдгээр функц дууссан гэсэн үг биш.

Auth одоо opaque session ашиглаж байна. Зурагт заасан JWT нь Нармандахын 8–9-р долоо хоногийн [шилжилтийн PR](AUTH_JWT_PLAN.md). Одоо байгаа хамгаалалтыг эвдэж JWT болсон мэт тэмдэглээгүй.

## Хуучин бүтцээс шинэчлэх

`apps/web` → `frontend`, `apps/api` → `backend`, Prisma → `database/prisma`, compose → `devops/compose.yaml`. npm workspace нэр @campusfind/web, @campusfind/api хэвээр тул dev команд өөрчлөгдөөгүй.

Хуучин dev серверүүдээ зогсоож root дээр `npm ci`, `npm run db:generate`, `npm run build` ажиллуулаад dev серверээ дахин асаа. Өмнө backend/.env эсвэл apps/api/.env үүсгэсэн бол утгаа root `.env` рүү **өөрөө тулгаж** шилжүүл; байгаа root `.env`-ийг дарж бичихгүй. Шинэ суулгалт `.env.example`-аас эхэлнэ.

Root `.env`-ийг backend startup, database CLI хоёул уншина; frontend түүнийг import хийхгүй. VITE\_ prefix-ээр нууц өгөгдөл дамжуулахгүй. Хуучин SQL migration-ийг дахин үүсгэх, DB volume устгах шаардлагагүй.

Идэвхтэй machine-readable эх: [delivery-plan.json](planning/delivery-plan.json). Лаб 3 болон өмнөх 17/18/18/17 SP санал нь [baseline-sprints.json](planning/baseline-sprints.json)-д historical-reference. Conflict-ийн эрсдэлийг давхаргын эзэмшил, жижиг shared PR, review дарааллаар бууруулна.
