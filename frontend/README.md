# Frontend — Л.Ирмүүн

React/TypeScript UI, form, browser state, API client. `src/features/`-ээр UI-гаа ангилна; backend/database файлыг давхар хуулж бичихгүй. API input/output/enum-ийг `@campusfind/contracts`-оос авна, бүх HTTP хүсэлтийг `src/api/client.ts`-ээр явуулна.

Repo root: `npm run dev:web`. Эхлээд `npm ci`, `npm run db:generate`, `npm run build`. Contract шинэчлэгдсэн бол rebuild хийгээд dev серверээ restart хийнэ.

8–9 auth/layout; 10–11 posts/upload/search/filter; 12–13 chat/comments/handover/edit-close; 14–15 responsive/demo. [Дэлгэрэнгүй хуваарь](../docs/DELIVERY_PLAN.md).

8–9-р долоо хоногийн төлөвлөгөө, API хамаарал, US-01/US-02 acceptance checklist: [FRONTEND_W08_09.md](../docs/FRONTEND_W08_09.md).

## Хуудас ба navigation

- `/` — нийтэд нээлттэй танилцуулга, ашиглах гурван алхам, нээгдэж хаагддаг FAQ. Нэвтрэлт шаардахгүй; API түр ажиллахгүй үед ч агуулга харагдана.
- `/register`, `/login`, `/verify-email` — бүртгэл, нэвтрэлт, и-мэйл баталгаажуулалт.
- `/posts` — зөвхөн баталгаажсан session-тэй хэрэглэгчийн зарууд.
- `/posts/new/lost`, `/posts/new/found` — зар үүсгэх форм.

Нэвтэрсний дараа болон зар нийтэлсний дараа `/posts` руу шилжинэ. Header-ийн брэнд, «Нүүр» холбоос `/` руу буцна.
