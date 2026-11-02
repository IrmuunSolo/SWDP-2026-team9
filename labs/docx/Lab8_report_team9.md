# Лаборатори 8 — Dockerfile, image ба container

**Баг:** 9 · **Төсөл:** CampusFind / SWDP-2026-team9  
**Огноо:** 2026-10-31 – 2026-11-03  
**Орчин:** Л.Ирмүүн — Windows, Docker Desktop · Э.Амарболд — Fedora Linux, Podman · Г.Нармандах — macOS, Colima. Бүгд `node:24-bookworm-slim` image ашигласан.  

## Зорилго

CampusFind төслийн Dockerfile-ийг бичиж image бүтээх, container ажиллуулах, source код өөрчлөгдөхөд layer caching хэрхэн ашиглагдахыг ажиглах. Docker Compose ашиглан frontend, API, PostgreSQL болон Mailpit-ийг хамт ажиллуулж, нэгдсэн урсгалыг баталгаажуулах.

## Л.Ирмүүн — Image, дан web container, layer caching

**Branch:** `lab08/irmuun-image`

### Хийсэн ажил

1. Docker болон Compose-ийн хувилбарыг шалгаж, Docker орчныг бэлтгэсэн.
2. `backend/src/main.ts`-д API сонсох хаягийг `process.env.HOST ?? '127.0.0.1'` болгосон. Startup log-д мөн энэ хаягийг харуулдаг болгосон. Dockerfile-д `ENV HOST=0.0.0.0` өгч container-ийн сүлжээнээс хандах тохиргоог бэлтгэсэн.
3. Root `.dockerignore` үүсгэж `.git`, `node_modules`, `dist`, `.env`, log, uploads болон labs хавтсыг build context-оос хассан.
4. Root `Dockerfile` үүсгэсэн. Node 24 суурь image дээр root болон workspace package manifest-уудыг эхэлж хуулж, `npm ci` ажиллуулсан. Дараа нь source кодыг хуулж, Prisma client үүсгэн contracts → database → API → frontend build хийсэн.
5. `campusfind:lab08` image бүтээж, command override ашиглан дан frontend container ажиллуулсан. Компьютерийн `15173` портыг container-ийн `5173` порттой холбож, browser дээр `http://localhost:15173` хаягаар web хуудсыг шалгасан.
6. `HomePage.tsx`-ийн харагдах бичвэрт түр өөрчлөлт хийж image-ийг дахин build хийсэн. Шинэ image-ээс web container-ийг дахин үүсгэж өөрчлөлтийг шалгасан. Туршилтын дараа бичвэрийг анхны утгад буцааж, image-ийг дахин бүтээн, түр web container-ийг зогсоож устгасан.

### Гол командууд

```powershell
docker build --progress=plain -t campusfind:lab08 .
docker run -d --name campusfind-lab08-web-run -p 127.0.0.1:15173:5173 campusfind:lab08 npm run dev -w @campusfind/web -- --host 0.0.0.0
docker logs campusfind-lab08-web-run
docker stop campusfind-lab08-web-run
docker rm campusfind-lab08-web-run
```

### Layer caching-ийн ажиглалт

| Алхам | Ажигласан үр дүн | Тайлбар |
| --- | --- | --- |
| `RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true npm ci` | `CACHED` | Dependency manifest-ууд өөрчлөгдөөгүй тул install layer-ийг дахин ашигласан. |
| `COPY . .` | `DONE 0.0s` | Source файл өөрчлөгдсөн тул хуулах алхам дахин ажилласан. |
| `RUN npm run build` | Build log гарч, `DONE 6.4s` болсон | Source COPY-ийн дараах build алхмыг дахин гүйцэтгэсэн. |

Dependency суулгах алхмыг source хуулах алхмын өмнө байрлуулснаар UI-ийн бичвэр өөрчлөгдөхөд dependency-г дахин суулгах шаардлагагүй байв. Түр өөрчилсөн `HomePage.tsx`-ийн одоогийн diff хоосон байна.

### Нотолгоо ба шалгалтын төлөв

![Зураг 2. Docker build дотор contracts, database, API болон frontend build амжилттай дууссан гаралт](../lab08/evidence/02-build-cache.png)

Хадгалсан зурагт `RUN npm run build` алхам `DONE 6.4s` болж дууссан нь харагдана. Cache ажиглалтад `npm ci`-ийн `CACHED`, `COPY . .`-ийн `DONE 0.0s` гаралтыг мөн шалгасан.

- Image build, дан web container болон cache туршилт: гүйцэтгэсэн.
- Дан web шалгалтын үед API/DB/SMTP ажиллуулаагүй тул бүртгэл, нэвтрэлтийн нэгдсэн урсгалыг энэ шатанд баталгаажуулаагүй.
- `git diff --check`: алдаагүй.
- `npm run check`, `npm test`: нэгдсэн шалгалтыг 3-р шатанд ажиллуулсан (Г.Нармандахын хэсгийг үзнэ үү).
- Commit/PR: #26 (`a0ae6ec`), main салбарт нэгтгэгдсэн.

## Э.Амарболд — Compose ба өгөгдлийн сан

**Branch:** `lab08/compose-stack`

### Хийсэн ажил

1. Ирмүүний PR main салбарт орсны дараа локал main салбараа шинэчилж, `lab08/compose-stack` шинэ салбар үүсгэсэн. Fedora Linux болон Podman (Docker CLI emulation) орчинд `campusfind:lab08` image-ийг дахин build хийж бэлтгэсэн.
2. `devops/compose.lab08.yaml` тусдаа Compose файл үүсгэж `postgres:17-alpine`, `axllent/mailpit:v1.27`, `api`, `web` гэсэн 4 сервист зориулсан сүлжээ, volume, healthcheck болон орчны хувьсагчдыг тохируулсан.
3. PostgreSQL болон Mailpit сервисүүдийг Compose-оор эхлүүлж, API image ашиглан `npm run db:deploy` ажиллуулж өгөгдлийн сангийн init migration-ийг амжилттай хийсэн.
4. Compose stack-ийг бүрэн босгохоос өмнө `podman run` (docker run) ашиглан дан API container ажиллуулж, log болон healthcheck endpoint-уудыг шалгасан.
5. `docker compose up -d --wait` командаар 4 сервисийг асааж, `postgres`, `mailpit`, `api` нь `Healthy`, `web` нь `Running` төлөвтэй болсныг болон `/api/v1/health/ready` хүсэлтээр `{"data":{"status":"ready"}}` хариу буцааж байгааг баталгаажуулсан.

### Гол командууд

```bash
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml config --quiet
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml up -d --wait postgres mailpit
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml run --rm --no-deps api npm run db:deploy
docker run -d --name campusfind-lab08-api-run --network campusfind-lab08_default -p 127.0.0.1:13000:3000 -e DATABASE_URL=postgresql://campusfind:local_dev_only@postgres:5432/campusfind?schema=public -e UNIVERSITY_EMAIL_DOMAINS=example.edu -e WEB_ORIGIN=http://localhost:15173 -e SMTP_HOST=mailpit -e SMTP_PORT=1025 -e SMTP_SECURE=false campusfind:lab08
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml up -d --wait
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml ps
curl -4 http://localhost:13000/api/v1/health/ready
```

### Шалгалтын үр дүн ба ажиглалт

| Алхам / Сервис | Төлөв | Ажигласан үр дүн | Тайлбар |
| --- | --- | --- | --- |
| `postgres` | `Healthy` | `pg_isready` healthcheck амжилттай | PostgreSQL 17 өгөгдлийн сан бэлэн болж `lab08_pg` volume-д холбогдсон. |
| `mailpit` | `Healthy` | Ports `18025->8025`, `1025` ажиллаж байна | И-мэйл туршилтын SMTP сервис бэлэн болсон. |
| `db:deploy` | `DONE` | Migration-ууд амжилттай ажилласан | DB schema бэлэн болж шаардлагатай хүснэгтүүд үүссэн. |
| `api` | `Healthy` | `status: ready` | NestJS API нь DB болон Mailpit-тэй сүлжээгээр амжилттай холбогдсон. |
| `web` | `Running` | Port `15173->5173` | Frontend container нь API proxy тохиргоотойгоор ажилласан. |

### Илэрсэн алдаа ба засвар

- **Podman CLI emulation болон IPv6 порт холболтын асуудал:** Fedora Linux дээр Podman emulation ашиглах үед стандарт `curl http://localhost:13000/...` нь IPv6 / Podman network socket-оос болж `Connection reset by peer` алдаа өгч байсан.
- **Засвар:** `curl` команд дээр IPv4-ийг тусгайлан заах `-4` туг ашиглаж (`curl -4 http://127.0.0.1:13000/api/v1/health/ready`), Compose орчноор 4 сервисийг хамтад нь асаан DB болон API хоорондын сүлжээний холболтыг хэвийн болгож шийдвэрлэсэн.

### Нотолгоо ба шалгалтын төлөв

Compose stack-ийн 4 сервис ажиллаж (`postgres`, `mailpit`, `api` — Healthy, `web` — Running), `/api/v1/health/ready` хүсэлтээр `{"data":{"status":"ready"}}` буцаасан нь бодит логиор нотлогдсон.

- Compose stack, DB migration болон healthcheck: гүйцэтгэсэн.
- `git diff --check`: алдаагүй.
- `npm run check`, `npm test`: нэгдсэн шалгалтыг 3-р шатанд ажиллуулсан (Г.Нармандахын хэсгийг үзнэ үү).
- Commit: `eeb7a59` (`lab08/compose-stack`). Г.Нармандахын PR-д багтаж main салбарт нэгтгэгдэнэ.

## Г.Нармандах — Backend ба нэгдсэн баталгаажуулалт

**Branch:** `lab08/backend-verification` · **Шалгасан commit:** `17a4fae`  
**Орчин:** macOS (Apple Silicon), Colima 0.10.3, Docker 29.7.2, Docker Compose v5.6.1, Node 24, npm 11

### Хийсэн ажил

1. Амарболдын `lab08/compose-stack` салбарыг review хийж, Compose файл тайлан болон командуудад заасан `devops/` хавтсанд биш `labs/lab08/devops/` дотор байсныг илрүүлсэн. Ингэснээр `-f devops/compose.lab08.yaml` команд ажиллахгүй, `build.context: ..` нь repo root биш `labs/lab08`-ийг заах байв. Файлыг `devops/compose.lab08.yaml` руу шилжүүлж, Prettier-ээр форматласан.
2. `backend/src/main.ts` нь `process.env.HOST ?? '127.0.0.1'` ашигладаг, Dockerfile болон Compose нь `HOST=0.0.0.0` өгдөг болохыг шалгасан. Backend кодонд нэмэлт засвар шаардлагагүй байв.
3. Image-ийг дахин build хийж, Compose-оор PostgreSQL, Mailpit, API, web сервисүүдийг асааж, migration хийсэн.
4. Тусдаа `campusfind_test` өгөгдлийн сан үүсгэж, түүн дээр migration болон integration тест ажиллуулсан.
5. Browser дээр бүртгүүлэх → Mailpit-ээр баталгаажуулах → нэвтрэх → гарах урсгалыг шалгасан.

### Гол командууд

```bash
docker build --progress=plain -t campusfind:lab08 .
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml up -d --wait
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml ps
curl -4 http://localhost:13000/api/v1/health/ready
T="postgresql://campusfind:local_dev_only@postgres:5432/campusfind_test?schema=public"
docker compose -p campusfind-lab08 -f devops/compose.lab08.yaml run --rm --no-deps \
  -e DATABASE_URL=$T -e TEST_DATABASE_URL=$T api npm run test:integration
npm run check && npm test && git diff --check
```

### Шалгалтын үр дүн

| Шалгалт | Үр дүн |
| --- | --- |
| `docker compose ps` | `api`, `postgres`, `mailpit` — healthy; `web` — running |
| `/api/v1/health/ready` | `{"data":{"status":"ready"}}` |
| Integration тест (`campusfind_test`) | 1/1 pass, 0 fail — бүртгүүлэх → баталгаажуулах → нэвтрэх → posts → гарах, түгжих болон хаагдсан session |
| UI урсгал | Бүртгүүлэх, Mailpit-ээр баталгаажуулах, нэвтрэх, гарах амжилттай; нэвтэрсний дараа «Зарууд» хуудас гарсан, оюутны код `B23****` хэлбэрээр нуугдсан |
| `npm run check` | Амжилттай: build, Prettier, 34 API гэрээ, plan, layout |
| `npm test` | API unit тест 25/25, Лаб 7 тест 15/15 pass |
| `git diff --check` | Алдаагүй |

### Илэрсэн алдаа ба засвар

- Compose файл буруу хавтсанд байсныг `devops/` руу зөөсөн.
- Файл `devops/`-д орсноор Prettier шалгалтад хамрагдаж, healthcheck-ийн урт мөр болон файлын төгсгөлийн хоосон мөрийн форматын алдаа гарсныг `prettier --write`-ээр зассан.
- Шалгалтын үед `mail.service.ts`-д санамсаргүй орсон мөрийн төгсгөлийн хоосон зайг `git restore`-оор буцаасан.

### Нотолгоо

![Зураг 1. Container-оос ажиллаж буй CampusFind](../lab08/evidence/01-app-running.png)
![Зураг 3. Compose-ийн 4 сервис ба readiness](../lab08/evidence/03-compose-ready.png)
![Зураг 4. PostgreSQL integration тест](../lab08/evidence/04-integration-test.png)
![Зураг 5. Mailpit-д ирсэн баталгаажуулах захиа](../lab08/evidence/05-mailpit-verify.png)

- Commit/PR: #27 (https://github.com/IrmuunSolo/SWDP-2026-team9/pull/27)

## Дүгнэлт

Баг CampusFind-ийн нэг image-ийг бүтээж, түүнээс API болон web container-уудыг ажиллуулж, Docker Compose-оор PostgreSQL болон Mailpit-тэй холбосон. Dependency manifest-уудыг source кодоос өмнө хуулснаар source өөрчлөгдөхөд `npm ci` layer кэшээс дахин ашиглагдаж, зөвхөн source COPY болон build алхам дахин ажилласан. Container орчинд бүртгүүлэх, и-мэйлээр баталгаажуулах, нэвтрэх, гарах урсгал бүтэн ажиллаж, integration тест болон нийт шалгалтууд амжилттай давсан.

Хязгаарлалт: JWT шилжилт энэ лабораторийн хүрээнд хийгдээгүй. Image нь development горимынх тул production-д зориулж оновчлоогүй.