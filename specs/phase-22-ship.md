# Phase Ship: phase-22 — Deploy (k8s manifest 예제)

## 📋 Overview

보일러플레이트의 마지막 단계 — 컨테이너 오케스트레이션 배포 예제. `tooling/k8s/` 에 apps/api·worker·postgres·redis 의 샘플 k8s 매니페스트를 제공하고, 로컬 kind 클러스터에서 기동·헬스까지 검증한다. 더불어 배포될 api/worker 이미지를 운영 수준으로 슬림화한다.

## 📦 Scope: 계획 vs 실제

| 구분 | 항목 | 비고 |
|:---:|---|---|
| ✅ 완료 | spec-22-01: k8s 샘플 매니페스트 + kind 검증 (PR #155) | |
| ➕ 추가 | spec-22-02: Dockerfile 슬림화 (PR #156) | spec-22-01 검증 중 이미지 비대 발견 → 추가 |

## 📊 Spec Summary

| PR | Spec | 핵심 변경 |
|---|---|---|
| #155 | spec-22-01-k8s-manifest-example | `tooling/k8s/` 매니페스트(api/worker/postgres/redis + ConfigMap/Secret/migrate Job) + verify.sh + 드리프트 테스트 + README |
| #156 | spec-22-02-dockerfile-slim | api/worker Dockerfile turbo prune + --prod 슬림화 (api 25%↓, worker 69%↓) |

## ✅ Success Criteria Checklist

| # | 기준 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | tooling/k8s/ 에 api·worker + postgres·redis manifest 존재 | ✅ PASS | api/worker/postgres/redis.yaml + config/secret/migrate-job/namespace.yaml (8개) |
| 2 | 로컬 클러스터 apply → api /health readiness 그린 + worker 기동 | ✅ PASS | `verify.sh`: migrate Job 완료 → rollout → `/health/ready` `{status:"ready"}` + `[worker] consumer started` |
| 3 | k8s manifest drift 검사 정합 | ✅ PASS | `manifest-drift.test.ts` 4 pass + `tooling:manifest` pass |

## 🧪 Integration Test Results

| # | 시나리오 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | k8s apply 후 헬스 그린 (kind apply → /health readiness 200, worker 기동) | ✅ PASS | `verify.sh` 슬림 이미지로 전 과정 PASS |

## 🏗 Architecture Decisions

- **순수 YAML 매니페스트**: helm/kustomize 추상화 없이 "무엇이 배포되는가" 직독 (예제 가독성 우선).
- **NODE_ENV=production + app_runtime 런타임 role**: 슈퍼유저 런타임은 RLS 격리 우회 → 샘플도 안전 경로(비-슈퍼유저 런타임 + 슈퍼유저 마이그레이션)를 모델링 (spec-17-07/16-02).
- **이미지 슬림화 = turbo prune + --prod --shamefully-hoist**: `pnpm deploy` 는 @repo/* 를 node_modules 로 옮겨 tsx 데코레이터 트랜스파일이 깨짐 → 워크스페이스 심볼릭링크를 보존하는 turbo prune 채택. hoisting 으로 fat 이미지의 평탄 해석 동작 복원.

## ⚠️ Known Issues / Technical Debt

- **`next`(~288MB)가 슬림 이미지에 잔존**: `@env-kit/node-settings@1.1.0` 이 `next` 를 직접 의존 → backend-settings 경유 api 까지. dep 정리 후속 필요.
- **k8s 드리프트 테스트가 CI(`turbo run test`)에 미수집**: tooling 이 워크스페이스 패키지가 아니라 `npx vitest run tooling/k8s` 수동 실행.
- **샘플 한정 범위**: helm/Ingress/TLS/HPA/PVC 등 운영 고급 리소스는 의도적 제외 (README 확장 포인트).

## 📝 Follow-up Work

- `@env-kit/node-settings` next 의존 제거/대체 → `backlog/queue.md` Icebox
- k8s 드리프트 테스트 CI 자동화 → Icebox
- 이미지 추가 슬림 (컴파일 + distroless) → Icebox
- k8s 운영 리소스 확장 (helm/Ingress/HPA/PVC) → Icebox

## 📊 Stats

- **Specs**: 2개 완료 (spec-22-01, spec-22-02)
- **이미지**: api 1.67GB→1.25GB (~25%↓), worker 1.67GB→512MB (~69%↓)
- **검증**: 성공 기준 3/3, 통합 시나리오 1/1, lint/typecheck 96/96
