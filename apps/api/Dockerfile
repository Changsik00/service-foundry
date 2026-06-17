# syntax=docker/dockerfile:1
# apps/api 컨테이너 이미지 — turbo prune 으로 api 의존성 부분집합 추출 + --prod 로 devDep 제외.
# 워크스페이스 구조(packages/* 심볼릭링크)를 보존해 tsx 의 데코레이터 트랜스파일이 동작한다.
# (pnpm deploy 는 @repo/* 를 node_modules 안으로 옮겨 tsx 가 데코레이터 tsconfig 를 적용하지 못함.)
#   docker build -f apps/api/Dockerfile -t service-foundry-api .  (컨텍스트 = monorepo 루트)
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- prune: @apps/api 의존성 부분집합(lockfile + 소스) 추출 (이 스테이지는 폐기) ---
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune @apps/api --docker

# --- runtime: prod 의존성만 설치 (devDep 제외), 워크스페이스 구조 보존 ---
FROM base AS runner
ENV NODE_ENV=production
COPY --from=pruner /app/out/json/ .
# lockfile 의 pnpmfileChecksum 정합 — turbo prune 산출물엔 .pnpmfile.cjs 가 없어 별도 복사.
COPY .pnpmfile.cjs ./
# --shamefully-hoist: 전이 의존성을 최상위 node_modules 로 hoist (fat 이미지의 해석 동작 복원).
# 일부 워크스페이스 패키지가 drizzle-orm 등을 hoisting 에 의존해 import 하므로 필요.
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist
COPY --from=pruner /app/out/full/ .
# NestJS 데코레이터 메타데이터용 root tsconfig (prune out 에 미포함).
COPY tsconfig.json ./tsconfig.json
WORKDIR /app/apps/api
EXPOSE 2026
# pnpm 우회(catalog/deps-check 회피) — tsx 바이너리 직접 실행.
CMD ["./node_modules/.bin/tsx", "--tsconfig", "../../tsconfig.json", "src/main.ts"]
