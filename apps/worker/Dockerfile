# syntax=docker/dockerfile:1
# apps/worker 컨테이너 이미지 — pnpm deploy --prod 로 worker 의 prod 폐쇄집합만 추출.
#   docker build -f apps/worker/Dockerfile -t service-foundry-worker .  (컨텍스트 = monorepo 루트)
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# --- build: 전체 설치 후 worker prod 폐쇄집합을 deploy (이 스테이지는 폐기) ---
FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@apps/worker deploy --prod --legacy /prod

# --- runtime: worker + prod 의존성만 (tsx 포함, devDep 제외) ---
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/ ./
COPY tsconfig.json ./tsconfig.json
CMD ["./node_modules/.bin/tsx", "--tsconfig", "tsconfig.json", "src/main.ts"]
