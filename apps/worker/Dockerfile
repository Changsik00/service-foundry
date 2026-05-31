# syntax=docker/dockerfile:1
# apps/worker 컨테이너 이미지 — 빌드 컨텍스트는 *모노레포 루트*.
#   docker build -f apps/worker/Dockerfile -t service-foundry-worker .
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/worker
CMD ["pnpm", "run", "start:prod"]
