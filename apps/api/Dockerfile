# syntax=docker/dockerfile:1
# apps/api 컨테이너 이미지 — pnpm deploy --prod 로 api 의 prod 폐쇄집합만 추출.
# devDep(biome/turbo/typescript/vitest…) 과 타 앱 소스를 제외해 런타임 이미지를 슬림화한다.
#   docker build -f apps/api/Dockerfile -t service-foundry-api .  (컨텍스트 = monorepo 루트)
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# --- build: 전체 설치 후 api prod 폐쇄집합을 deploy (이 스테이지는 폐기) ---
FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@apps/api deploy --prod --legacy /prod

# --- runtime: api + prod 의존성만 (tsx·drizzle-kit 포함, devDep 제외) ---
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/ ./
# NestJS 데코레이터 메타데이터용 root tsconfig.
# (deployed 로컬 tsconfig 는 @repo/typescript-config 를 extends 하나 devDep 라 런타임에 없음.)
COPY tsconfig.json ./tsconfig.json
EXPOSE 2026
CMD ["./node_modules/.bin/tsx", "--tsconfig", "tsconfig.json", "src/main.ts"]
