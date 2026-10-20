# Backend — Г.Нармандах

NestJS controller → service → data adapter. `src/modules/` нь функцийн модуль. **Comments/Admin API-г Э.Амарболд** өөрийн хоёр хавтсанд хэрэгжүүлнэ; AppModule/common guard/schema-ийн холболтыг Нармандах review хийнэ.

Repo root: `npm run dev:api`. Root `.env`-ийг development болон compiled startup аль алинд нь уншина. Client/schema/query нь `@campusfind/database`, HTTP DTO нь `@campusfind/contracts`.

8–9 auth + [JWT шилжилт](../docs/AUTH_JWT_PLAN.md); 10–11 posts/privacy/secret; 12–13 chat/handover/claim/notifications; 14–15 API QA/review/report. [API гэрээ](../docs/API.md), [хуваарь](../docs/DELIVERY_PLAN.md).
