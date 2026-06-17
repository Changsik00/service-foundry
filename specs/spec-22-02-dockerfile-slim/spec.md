# spec-22-02: Dockerfile 멀티스테이지 슬림화 (turbo prune)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-22-02` |
| **Phase** | `phase-22` |
| **Branch** | `spec-22-02-dockerfile-slim` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-16 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

`apps/api/Dockerfile` · `apps/worker/Dockerfile` 은 단일 스테이지로:
```dockerfile
COPY . .                            # monorepo 전체 (apps/web/Next, firebase, 모든 packages)
RUN pnpm install --frozen-lockfile  # 960 패키지 전부 설치
```
spec-22-01 검증 중 측정: 이미지 빌드 **각 ~11분**, 이미지에 api 와 무관한 frontend 의존성(Next, firebase, react 등) + 전체 devDep 이 통째로 포함된다.

### 문제점

- **이미지 비대**: api 런타임에 불필요한 frontend/타 앱 의존성 포함 → 크기·공격표면 증가.
- **빌드 느림**: 변경과 무관한 전체 워크스페이스 설치 → 캐시 효율 저하.
- 운영 보일러플레이트로서 "그대로 배포" 하기엔 부적절.

### 해결 방안

표준 turborepo Docker 패턴(`turbo prune --docker`)으로 **apps/api / worker 의존성 부분집합만** 격리해 멀티스테이지 빌드한다. pruner→installer→runner 3-stage 로 최종 이미지에는 해당 앱과 그 워크스페이스 의존성만 남긴다. 런타임은 기존 tsx 유지(최소 변경).

## 요구사항

1. `apps/api/Dockerfile` · `apps/worker/Dockerfile` 을 멀티스테이지(turbo prune)로 재작성.
2. 최종 이미지에 frontend/타 앱 의존성 미포함 (api 이미지에 next/firebase 없음).
3. 이미지 크기 **현재 대비 감소** (정량: `docker images` 비교, 목표 30%+ 감소).
4. 기능 동등성: 슬림 이미지로 빌드한 api/worker 가 **k8s(kind)에서 그대로 기동** — `tooling/k8s/verify.sh` PASS (api `/health/ready` 200 + worker 기동).
5. `.dockerignore` 정합 유지 (빌드 컨텍스트 최소화).

## Out of Scope

- tsx → 컴파일(tsc/tsup) 전환 (별도 후속 — 본 spec 은 prune 만으로 큰 이득 확보).
- distroless/alpine 베이스 전환 (node:24-slim 유지).
- 이미지 보안 스캔(trivy 등) 도입.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 런타임 유지 전략: tsx(현행 유지, 최소 변경) — *권장*. 컴파일 전환은 Out of Scope 후속.

> [!WARNING]
> - [ ] tsx 런타임은 root `tsconfig.json`(`../../tsconfig.json`) 참조 → pruned 이미지에 root tsconfig 포함 필요. 누락 시 기동 실패 → verify 로 확인.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **의존성 격리** | `turbo prune @apps/api --docker` | api 부분집합 lockfile+소스만 → 최종 이미지 슬림 |
| **스테이지** | pruner → installer → runner | json 레이어 분리로 소스 변경 시 install 캐시 재사용 |
| **prune 도구 주입** | pruner 스테이지에서 `pnpm dlx turbo@<ver> prune` | 전체 install 없이 turbo 만 확보 |
| **런타임** | node:24-slim + tsx (유지) | 최소 변경, prune 만으로 목표 달성 |

### 스테이지 개요
```dockerfile
FROM node:24-slim AS pruner
# corepack + COPY . . + pnpm dlx turbo prune @apps/api --docker → out/json, out/full

FROM node:24-slim AS installer
# COPY out/json + lockfile → pnpm install --frozen-lockfile (부분집합) → COPY out/full

FROM node:24-slim AS runner
# COPY installer 결과 + root tsconfig → WORKDIR apps/api → CMD tsx start:prod
```

## Proposed Changes

#### [MODIFY] `apps/api/Dockerfile`
단일 스테이지 → pruner/installer/runner 멀티스테이지(`turbo prune @apps/api --docker`).

#### [MODIFY] `apps/worker/Dockerfile`
동일 패턴(`turbo prune @apps/worker --docker`).

#### [MODIFY] (필요 시) `.dockerignore`
prune 컨텍스트에 맞춰 불필요 항목 정리(현행 충분하면 무변경).

## 검증 계획

```bash
# 빌드 + 크기 비교
docker build -f apps/api/Dockerfile -t service-foundry-api:slim .
docker images | grep service-foundry-api      # slim vs local 크기 비교
docker run --rm service-foundry-api:slim sh -c "ls node_modules | grep -E 'next|firebase' || echo 'no-frontend-deps ✓'"

# 기능 동등성 (k8s 통합)
bash tooling/k8s/verify.sh                     # 슬림 이미지로 api/worker 기동
```

수동 검증 시나리오:
1. 슬림 이미지 빌드 → `docker images` 크기 현재 대비 감소 — 기대: 30%+↓
2. api 이미지에 frontend 의존성 부재 확인
3. `verify.sh` → api `/health/ready` 200 + worker 기동

## ADR 후보

- [ ] 없음 (표준 turborepo 패턴 적용 — phase-22.md 결정 기록으로 충분)

## ✅ Definition of Done

- [ ] api/worker Dockerfile 멀티스테이지 전환
- [ ] 이미지 크기 현재 대비 감소 (측정 증빙)
- [ ] `tooling/k8s/verify.sh` PASS (기능 동등성)
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-22-02-dockerfile-slim` 브랜치 push 완료
