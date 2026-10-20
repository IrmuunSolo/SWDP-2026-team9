# DevOps — Э.Амарболд

`compose.yaml`: локал PostgreSQL 17 + Mailpit. Repo root дээр `npm run infra:up`, `npm run infra:down`. CLI хэрэглэх бол `docker compose -p swdp-2026-team9 -f devops/compose.yaml ...`.

Compose project name нь `swdp-2026-team9`. Root npm команд болон шууд Compose команд ажиллуулахдаа энэ нэрийг ашиглана. `infra:down` нь PostgreSQL өгөгдлийн volume-ийг хадгална.

GitHub workflow файлууд root `.github/workflows/`-т байрлана, owner нь мөн Амарболд. Лаб 7-ын CI хадгалагдана; foundation workflow нь root commands-аар frontend/backend/database-ийг build хийж PostgreSQL integration test ажиллуулна.

14–15-р долоо хоногт: staging орчин/HTTPS, migration deploy, DB backup/restore туршилт, SMTP credential, private upload storage, health/readiness, E2E, rollback/forward-fix болон ажиллуулах заавар. Local Compose нь хөгжүүлэлтийн орчинд зориулагдсан. Production deployment нь 14–15-р долоо хоногийн ажил.
