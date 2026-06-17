# syntax=docker/dockerfile:1
# apps/worker 컨테이너 이미지 — turbo prune 으로 worker 의존성 부분집합 추출 + --prod 로 devDep 제외.
# 워크스페이스 구조(packages/* 심볼릭링크) 보존 (tsx 데코레이터/모듈 해석).
#   docker build -f apps/worker/Dockerfile -t service-foundry-worker .  (컨텍스트 = monorepo 루트)
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- prune: @apps/worker 의존성 부분집합 추출 (이 스테이지는 폐기) ---
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune @apps/worker --docker

# --- runtime: prod 의존성만 설치 (devDep 제외) ---
FROM base AS runner
ENV NODE_ENV=production
COPY --from=pruner /app/out/json/ .
# --shamefully-hoist: 전이 의존성 최상위 hoist (fat 이미지 해석 동작 복원).
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist
COPY --from=pruner /app/out/full/ .
COPY tsconfig.json ./tsconfig.json
WORKDIR /app/apps/worker
CMD ["./node_modules/.bin/tsx", "--tsconfig", "../../tsconfig.json", "src/main.ts"]
