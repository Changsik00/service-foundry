# syntax=docker/dockerfile:1
# apps/api 컨테이너 이미지 — 빌드 컨텍스트는 *모노레포 루트* (workspace 설치 필요).
#   docker build -f apps/api/Dockerfile -t service-foundry-api .
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /app

# 전체 워크스페이스 복사 후 frozen 설치 (재현성). tsx 로 실행하므로 devDep 포함 설치.
COPY . .
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "run", "start:prod"]
