# Database ба storage — Э.Амарболд

| Зам | Үүрэг |
|---|---|
| `prisma/schema.prisma` | Өгөгдлийн model, холбоос, index |
| `prisma/migrations/` | Нэгэнт хэрэглэсэн SQL-ийг өөрчлөхгүй; шинэ migration нэмнэ |
| `src/index.ts` | Backend-д Prisma client/type/query export |
| `src/queries/` | Search/filter, цаашдын parameterized repository query |
| `src/storage/file-store.ts` | Backend upload API-д нийлүүлэх storage interface |
| `src/seed.ts` | Development fixture; admin үүсгэхгүй, existing record-ийг дарахгүй |

Энэ package React/NestJS-ийг import хийхгүй. Business permission, HTTP response нь backend-д; query/index/storage нь энд. Хайлт, filter одоо typed pending error буцаадаг seam; backend 501 болгон хөрвүүлнэ. Full-text SQL хэрэгтэй бол `$queryRaw` tagged template/parameter binding хэрэглэж, ranking/pagination result contract-оо Нармандахтай тохиролцоно. SQL string-д хэрэглэгчийн q-г шууд залгахгүй.

Root `.env` дахь DATABASE_URL-г CLI командууд уншина. Repo root:

```powershell
npm.cmd run db:generate
npm.cmd run db:validate
npm.cmd run db:deploy
# Зөвхөн schema өөрчилж буй хүн:
npm.cmd run db:migrate -- --name short_change_name
```

Локал demo seed (migration-аа эхэлж хэрэглэнэ):

```powershell
$env:SEED_DEMO_PASSWORD = "local-only-demo-123"
npm.cmd run db:seed
Remove-Item Env:SEED_DEMO_PASSWORD
```

`owner@example.edu`, `finder@example.edu`, `visitor@example.edu` гэсэн баталгаажсан local MEMBER fixture, 2 жишиг зар үүснэ. Зөвхөн localhost development DB дээр ажиллана; production/CI-д автоматаар ажиллуулахгүй. Existing password-ийг дахин seed хийхэд сольдоггүй. Нууц үг нь зөвхөн энэ локал fixture-ийн жишээ; бодит хэрэглэгчид ашиглахгүй.
