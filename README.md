# CampusFind

**Их сургуулийн гээгдсэн болон олдсон эд зүйлсийн систем · Баг 9**

Программ хангамж хөгжүүлэлтийн процесс хичээлийн багийн төсөл. CampusFind нь их сургуулийн орчинд гээгдсэн, олдсон эд зүйлсийг бүртгэх, хайх, эзэмшигчийг баталгаажуулж хүлээлгэн өгөхөд туслах веб систем юм.

## Баг ба үүргийн хуваарь

| Гишүүн | Оюутны код | Багийн үүрэг | Хөгжүүлэлтийн хүрээ |
| --- | --- | --- | --- |
| Л.Ирмүүн | B232270021 | Product Owner | Frontend (React), хэрэглэгчийн урсгал, acceptance |
| Г.Нармандах | B232270057 | Scrum Master | Үндсэн backend (NestJS), API, бизнес логик |
| Э.Амарболд | B222270048 | Developer | Database, DevOps, Comments болон Admin API |

Гишүүн бүрийн 8–15-р долоо хоногийн ажил, кодын эзэмшил, ажлын хамаарал болон нэгтгэх дарааллыг [хөгжүүлэлтийн төлөвлөгөө](docs/DELIVERY_PLAN.md)-нд тодорхойлсон. Product Backlog-ийг [GitHub Projects](https://github.com/users/IrmuunSolo/projects/2/views/1) дээр удирдана.

## Технологи ба кодын бүтэц

React + TypeScript + Vite, NestJS REST API, PostgreSQL 17 + Prisma, Zod API гэрээ, Docker Compose, Mailpit, GitHub Actions ашиглана. Хөгжүүлэлтийн орчин: **Node.js 24.x, npm 11.x**.

```text
frontend/              React UI, API client
backend/               NestJS API, нэвтрэлт, бизнес логик
  src/modules/comments/  Амарболдын хариуцах Comments API
  src/modules/admin/     Амарболдын хариуцах Admin API
database/              Prisma schema, migration, seed, query, storage
devops/                Docker Compose, дэд бүтцийн тохиргоо
packages/contracts/    Нэгдсэн request/response schema, API гэрээ
.github/workflows/     CI workflow
scripts/               Гэрээ үүсгэх, төлөвлөгөө ба бүтцийн шалгалт
docs/                  Архитектур, API, багийн хөгжүүлэлтийн заавар
labs/                  Лабораторийн ажил
  docx/                Лабораторийн тайлангууд
  lab06/               Лаб 6-ын дадлагын код
  lab07/               Лаб 7-ын модуль ба тест
```

## Хөгжүүлэлтийн төлөв

Суурь хэрэгжүүлэлтэд бүртгэл, и-мэйл баталгаажуулалт, нэвтрэлт/гаралт, session cookie, зар үүсгэх/унших API, React форм, PostgreSQL schema/migration болон CI тохиргоо багтсан.

Зураг оруулах, хайлт/шүүлтүүр, сэтгэгдэл, хувийн чат, эзэмшил болон хүлээлгэн өгөх баталгаажуулалт, мэдэгдэл, moderation нь цааш хэрэгжүүлэх ажлууд. Гэрээ нь бэлэн боловч хэрэгжээгүй API замууд `501 NOT_IMPLEMENTED` буцаана. Нэвтрэлт одоогоор opaque session ашигладаг; [JWT шилжилт](docs/AUTH_JWT_PLAN.md) нь төлөвлөсөн ажил.

## Локал орчинд эхлүүлэх

Git, Node.js 24 болон Docker Desktop суулгаж, Docker engine-ийг асаасан байна. Доорх командуудыг **repo-ийн үндсэн хавтаснаас**, PowerShell дээр ажиллуулна. Дэлгэрэнгүй тохиргоо: [SETUP.md](docs/SETUP.md).

```powershell
npm.cmd ci
# .env байхгүй бол жишиг тохиргоог хуулна.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run db:generate
npm.cmd run infra:up
npm.cmd run db:deploy
npm.cmd run build
```

Root `.env` доторх сургуулийн и-мэйл домэйн болон бусад тохиргоог SETUP зааврын дагуу тохируулна. Дараа нь хоёр тусдаа terminal нээнэ:

```powershell
# Terminal 1 — backend
npm.cmd run dev:api
```

```powershell
# Terminal 2 — frontend
npm.cmd run dev:web
```

| Үйлчилгээ | Хаяг |
| --- | --- |
| Веб апп | http://localhost:5173 |
| API health | http://localhost:3000/api/v1/health |
| API баримт (Swagger) | http://localhost:3000/docs |
| Локал и-мэйл (Mailpit) | http://localhost:8025 |

Бүртгэлийн баталгаажуулах и-мэйлийг Mailpit-ээс нээнэ. Үйлчилгээг зогсоохдоо `npm.cmd run infra:down` ашиглана; өгөгдлийн volume хадгалагдана.

## Багаар хөгжүүлэх заавар

| Баримт | Агуулга |
| --- | --- |
| [Эндээс эхлэх](docs/START_HERE.md) | Кодын бүтэц, унших дараалал, ажил эхлэх |
| [Хөгжүүлэлтийн төлөвлөгөө](docs/DELIVERY_PLAN.md) | Хэн, ямар кодыг, хэзээ бичих; хамаарал ба review |
| [API гэрээ ба эрх](docs/API.md) | Request/response, authentication, permission, алдаа |
| [API замуудын хүснэгт](docs/api/routes.md) | Зам бүрийн owner, хугацаа, хэрэгжилтийн төлөв |
| [Архитектур](docs/ARCHITECTURE.md) | Давхарга, өгөгдлийн загвар, бизнес дүрэм |
| [Branch → PR → merge](docs/CONTRIBUTING.md) | Branch үүсгэх, код бичих, review, conflict, revert |
| [Тест ба Done шалгуур](docs/TESTING.md) | Unit, integration, acceptance шалгалт |
| [GitHub тохиргоо](docs/REPOSITORY_SETTINGS.md) | Main хамгаалалт, CODEOWNERS, Projects |

Өөрийн task-д тусдаа branch үүсгэж Pull Request (PR)-ээр нэгтгэнэ. API гэрээ, schema/migration болон dependency өөрчлөлтийг холбогдох гишүүдтэй review хийнэ. `.env`, нууц мэдээлэл, `node_modules`, build үр дүнг commit хийхгүй.

## Шалгах командууд

```powershell
npm.cmd run check
npm.cmd test
```

`check` нь build, формат, API гэрээ, төлөвлөгөө болон давхаргын хамаарлыг шалгана. PostgreSQL integration тестийг тусдаа тестийн өгөгдлийн сантайгаар [TESTING.md](docs/TESTING.md)-ийн дагуу ажиллуулна. Шалгалтын үр дүн, ажиллуулаагүй шалгалтуудыг [VERIFICATION.md](docs/VERIFICATION.md)-д тэмдэглэсэн.

## Лабораторийн тайлангууд

Тайлангууд [`labs/docx/`](labs/docx/) хавтаст байрлана.

| Лаборатори | Тайлан |
| --- | --- |
| Лаб 1–2 | [Lab1,2_report_team 9.pdf](<labs/docx/Lab1,2_report_team 9.pdf>) |
| Лаб 3 | [Lab3_report_team9.pdf](labs/docx/Lab3_report_team9.pdf) |
| Лаб 4 | [Lab4_report_team9.pdf](labs/docx/Lab4_report_team9.pdf) |
| Лаб 5 | [Lab5_report_team9.pdf](labs/docx/Lab5_report_team9.pdf) |
| Лаб 6 | [Lab6_report_team9.pdf](labs/docx/Lab6_report_team9.pdf) |
| Лаб 7 | [Lab7_report_team9.pdf](labs/docx/Lab7_report_team9.pdf) |

Нэмэлт баримт: [Sprint 1](<labs/docx/Sprint 1.md>).
