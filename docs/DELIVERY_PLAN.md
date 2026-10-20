# 8–15-р долоо хоногийн хөгжүүлэлтийн төлөвлөгөө

Идэвхтэй эх нь багийн зурагт хуваарь. Ирмүүн frontend ба PO acceptance, Нармандах үндсэн backend ба SM, Амарболд database/DevOps, мөн comments/admin API-г хариуцна.

| Хугацаа                  | Л.Ирмүүн — Frontend React                              | Г.Нармандах — Backend NestJS                                           | Э.Амарболд — Database, DevOps                                    |
| ------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 8–9 Суурь + Auth         | React layout; register/login; US-01/02 шалгуур         | Nest/Auth; и-мэйл; JWT шилжилт; 5 оролдлого → 10 минут түгжих          | PostgreSQL users/posts; migration; seed; backend CI              |
| 10–11 Зар + Хайлт        | LOST/FOUND форм; upload UI; хайлт/шүүлтүүр             | Post US-04/07; secret+hash US-08; privacy US-03; upload/query facade   | Зураг хадгалалт US-05; full-text+index US-09; filter query US-10 |
| 12–13 Claim + Moderation | Chat/comments UI; handover дэлгэц; edit/close UI US-06 | Chat/Handover US-12/13; claim; Notification/SMTP US-14; edit/close API | Comments API US-11; Admin/block API US-15; integration test      |
| 14–15 QA + Demo          | Responsive/UI засвар; demo сценарий; PO acceptance     | API засвар; Review/Retro; эцсийн тайлан                                | Deploy; E2E; README, ажиллуулах заавар                           |

## Кодын эзэмшил

| Зам                                                                      | Үндсэн эзэн           | Холболт ба review                                                            |
| ------------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------- |
| `frontend/` бүх UI/API client                                            | Ирмүүн                | Нармандах request/response нийцлийг шалгана                                  |
| `backend/src/modules/auth, posts, chat, handover, notifications, users/` | Нармандах             | Амарболд DB/transaction; Ирмүүн consumer contract review                     |
| `backend/src/modules/comments/`, `admin/`                                | Амарболд              | Зурагт заасан backend доторх хоёр exception; Нармандах review                |
| `backend/src/common/`, `app*`, config                                    | Нармандах             | Guard/DI/error өөрчлөлтийг shared PR-аар холбоно                             |
| `database/`                                                              | Амарболд              | Schema, migration, seed, client, query/index, file-storage adapter           |
| `devops/`, `.github/workflows/`, root npm/lockfile                       | Амарболд              | Install/build/CI/compose/deploy; хэрэглэгч давхаргын owner review            |
| `packages/contracts/`                                                    | Хамтарсан             | Frontend/API/data interface өөрчлөхдөө нийлүүлэгч, хэрэглэгч хоёр тал review |
| `docs/`                                                                  | Тухайн хүрээний owner | Эцсийн README/ажиллуулах зааврыг Амарболд нэгтгэнэ                           |

`.github/workflows/` нь GitHub-ийн шаардлагаар root дээр үлдэнэ. `database/` нь React/NestJS-ээс үл хамаарах package; backend нь Nest DbService adapter-аар client-ийг хэрэглэнэ. Frontend database package-ийг import хийхгүй.

## API owner ба давхаргын ялгаа

API `owner` нь controller/service-ийн эзэн: comments/admin — Амарболд, бусад — Нармандах. Бүх замын frontendOwner=irmuun, dataOwner=amarbold. [API хүснэгт](api/routes.md) ба OpenAPI дээр гурван owner болон weekBlock тусдаа байна.

US-09-ийн UI-г Ирмүүн, HTTP validation/authorization-г Нармандах, full-text query/index-ийг Амарболд бичнэ. US-05-ийн upload UI-г Ирмүүн, multipart/permission facade-г Нармандах, storage/quota-г Амарболд бичнэ. Нэг story гэдгээр нэг хүн бусдын давхаргыг давхар засахгүй.

## Нэгтгэх дараалал

1. **8–9:** database/migration → auth API → frontend integration. UI/API agreed contract ба fixture-тэй зэрэгцэж болно. JWT нь [тусгай шилжилтийн ажил](AUTH_JWT_PLAN.md); одоогийн opaque session-г JWT болсон гэж тооцохгүй.
2. **10–11:** shared contract → database query/storage → backend adapter → frontend integration. Search/filter, upload-ийн frontend-ийг fixture-тэй зэрэгцүүлэн бичнэ.
3. **12–13:** chat participant guard → secret verification → owner assignment → хоёр талын transaction confirmation → notification. Амарболд comments/admin API-гаа тусдаа хавтсанд хийж, AppModule холболтоо Нармандахтай нэгтгэнэ.
4. **14–15:** staging deploy → integration/E2E → PO acceptance/demo → Review/Retro/тайлан.

US-03-ын public mask 10–11-д; full code disclosure нь 12–13-д chat participant guard бэлэн болсон үед. US-08-ын question/hash хадгалалт 10–11-д; private chat дахь хариулт/claim verification 12–13-д. Нэг story-г хуваасан тул SP давхар нэмэхгүй.

## Branch ба review

- Ирмүүн: `feat/w10-us04-frontend-post-form` → Нармандах review.
- Нармандах: `feat/w10-us04-backend-posts` → Амарболд DB review; UI-д нөлөөлбөл Ирмүүн давхар.
- Амарболд: `feat/w10-us09-database-search` → Нармандах query contract review.
- Амарболдын comments/admin PR → Нармандах. Shared contract/migration PR эхэлж main-д орно; dependent PR Draft байна.

Issue бүрд frontend/backend/database checklist, owner, branch/PR холбоно. Өөрийн давхарга дууссан нь бүх story Done гэсэн үг биш: холбогдсон UI/API/DB урсгал, тест ба acceptance хамт дуусна.

## Түүхэн төлөвлөгөө

Лаб 3-ын Sprint 1=17 SP, нийт backlog=70 SP гэсэн баримт хэвээр. Өмнөх 17/18/18/17 SP хуваарь [baseline-sprints.json](planning/baseline-sprints.json)-д historical-reference болж хадгалагдсан; одоо ажил оноох эх биш.

Зурагт хуваарь нь хугацаа ба давхаргын төлөвлөгөө. Хуучин 18 SP таамагт автоматаар багтсан гэж үзэхгүй; Planning-д үлдсэн бодит ажил, velocity, integration ачааллыг шалгана. Идэвхтэй эх [delivery-plan.json](planning/delivery-plan.json); `npm run check:plan` нь owner/story/dependency/route metadata-г тулгана.
