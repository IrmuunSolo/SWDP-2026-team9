# Багийн хөгжүүлэлтийг эндээс эхлэх

CampusFind нь frontend, backend, database, DevOps гэсэн дөрвөн үндсэн хэсэгтэй. Гишүүн бүр өөрийн хариуцах давхаргад ажиллаж, нэгдсэн API гэрээгээр холбогдоно.

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

React auth/posts form, NestJS register/verify/login/logout/me, session cookie, post create/read, pagination, PostgreSQL schema/migration, health, Zod validation, API гэрээ ба CI бэлэн. Search/filter, chat, handover, upload, notification, moderation нь төлөвлөсөн ажил бөгөөд хэрэгжээгүй API замууд 501 буцаана.

Нэвтрэлт opaque session ашиглана. JWT хэрэгжүүлэх ажил Нармандахын 8–9-р долоо хоногийн [төлөвлөгөөнд](AUTH_JWT_PLAN.md) багтана.

## Ажил эхлэх

1. Repo-г татаж, [SETUP.md](SETUP.md)-ийн дагуу dependency, PostgreSQL, Mailpit-аа бэлдэнэ.
2. Root `.env.example`-аас `.env` үүсгэж тохируулна. Backend болон database CLI энэ файлыг уншина. Frontend-д нууц тохиргоо дамжуулахгүй.
3. [Хөгжүүлэлтийн төлөвлөгөө](DELIVERY_PLAN.md)-өөс өөрийн task, owner, dependency-г шалгана.
4. `main`-аас ажлын branch үүсгэж, өөрийн давхаргад код бичнэ. [PR заавар](CONTRIBUTING.md)-ыг дагана.
5. Шалгалтуудаа ажиллуулж, PR нээгээд review авна.

Бүх npm командыг repo root дээр ажиллуулна. Workspace нэр нь frontend-д `@campusfind/web`, backend-д `@campusfind/api`, database-д `@campusfind/database` байна.

Ажил оноох эх нь [delivery-plan.json](planning/delivery-plan.json). Давхаргын эзэмшил, жижиг PR, shared contract-ийн review дарааллыг мөрдөнө.
