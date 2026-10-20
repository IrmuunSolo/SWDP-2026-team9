# DevOps — Э.Амарболд

`compose.yaml`: локал PostgreSQL 17 + Mailpit. Repo root дээр `npm run infra:up`, `npm run infra:down`. CLI хэрэглэх бол `docker compose -p swdp-2026-team9 -f devops/compose.yaml ...`.

Project name-г хуучин repo-ийн default `swdp-2026-team9`-тэй ижил хадгалсан тул хавтас шилжүүлснээр өөр DB volume үүсгэхгүй. Existing volume-ийг устгах, reset хийх команд хэрэггүй. Өмнө өөр `-p` нэрээр ажиллуулж байсан бол тэр project-оо зориуд сонгоно; data migration автоматаар хийгдэхгүй.

GitHub workflow файлууд root `.github/workflows/`-т үлдэнэ, owner нь мөн Амарболд. Лаб 7-ын CI хадгалагдана; foundation workflow нь шинэ root commands-аар frontend/backend/database-ийг build хийж PostgreSQL integration test ажиллуулна.

14–15-р долоо хоногт: staging орчин/HTTPS, migration deploy, DB backup/restore туршилт, SMTP credential, private upload storage, health/readiness, E2E, rollback/forward-fix болон ажиллуулах заавар. Одоогийн local compose-г production deployment гэж үзэхгүй; энэ өөрчлөлт remote deploy хийгээгүй.
