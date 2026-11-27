
# ─────────────────────────────
# Stage 1: Base
# ─────────────────────────────
FROM node:22-bookworm-slim AS base

WORKDIR /app

RUN corepack enable


# ─────────────────────────────
# Stage 2: Build dependencies
# ─────────────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile


# ─────────────────────────────
# Stage 3: Build application
# ─────────────────────────────
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY . .

RUN pnpm db:generate-client
RUN pnpm build


# ─────────────────────────────
# Stage 4: Production dependencies
# ─────────────────────────────
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile


# ─────────────────────────────
# Stage 5: Production runtime
# ─────────────────────────────
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 3001

CMD ["node", "dist/server.js"]
