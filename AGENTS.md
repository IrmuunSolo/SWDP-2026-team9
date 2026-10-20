# CampusFind coding rules

- Read `docs/START_HERE.md`, `docs/DELIVERY_PLAN.md` and `docs/API.md` before implementation.
- Respect layer ownership: frontend=Irmuun, core backend=Narmandakh, database/devops=Amarbold, backend comments/admin=Amarbold. Changes to shared contract, Prisma schema/migrations, dependencies, App shell and common security require a small coordinated PR.
- Use `packages/contracts/src/index.ts` for request/response schemas. Never duplicate enums or expose Prisma records directly.
- Backend: Nest controller → service → DbService. Derive actor/author/sender from authenticated identity, not request body. Apply object membership checks in addition to roles.
- Planned routes return 501. Do not return fake success or silently mark a story complete. Add the real module before PlannedModule, then change contract status and tests together.
- Preserve `labs/lab06`, `labs/lab07` and the existing Lab 7 workflow during feature work.
- Do not commit .env, passwords, raw tokens, node_modules, dist, uploads or personal reports unrelated to the change.
- Add SQL migrations, never rewrite a migration already merged into main. Use an isolated campusfind_test DB for integration tests.
- Required checks: `npm run check`, `npm test`, relevant `npm run test:integration`, `git diff --check`. Report checks not run and why; do not claim Docker/CI ran without evidence.
- Keep LF, UTF-8 and Prettier. Do not mass-format unrelated files. Never force-push main or use destructive reset to solve conflicts.
- README and user-facing explanations are Mongolian. Code identifiers and API keys remain English camelCase.
