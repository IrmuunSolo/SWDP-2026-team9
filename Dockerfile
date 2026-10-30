FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY database/package.json ./database/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json

RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true npm ci

COPY . .

RUN DATABASE_URL=postgresql://campusfind:local_dev_only@localhost:5432/campusfind npm run db:generate
RUN npm run build

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000 5173

CMD ["npm", "run", "start", "-w", "@campusfind/api"]