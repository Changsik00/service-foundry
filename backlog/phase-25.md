# phase-25: Deploy (k8s manifest 예제)

> 보일러플레이트의 마지막 단계 — 배포 예제(컨테이너 오케스트레이션).
> ⚠️ 2026-06-02 재배치: CI/CD(PR 게이트·changesets·docker publish)는 **phase-14 에서 완료**, knip/depcruise 게이트는 phase-15 에서 완료. 본 phase 는 **k8s manifest 예제 잔여분**만. (멀티테넌트 SaaS 로드맵 확정으로 deploy 를 맨 뒤 phase-25 로 이동 — infra 전에 멀티테넌시·계정·인가·데이터·어드민·빌링 선행, → ADR-0022.)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-25` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황
phase-14 에서 CI(turbo affected lint/typecheck/test/build) + docker publish + changesets 가 완성됐고, phase-15 에서 knip/depcruise 게이트까지 그린. 남은 것은 **운영 배포 예제(k8s manifest)** 뿐 — service-foundry 가 "로컬뿐 아니라 클러스터에서도 돌릴 수 있는" 보일러플레이트가 되려면 apps/api·worker·postgres·redis 의 샘플 manifest 가 있어야 한다.

### 목표 (Goal)
`tooling/k8s/` 에 apps/api / apps/worker / postgres / redis 의 sample manifest 를 제공하고, 로컬 클러스터(kind/minikube)에서 기동·헬스 확인까지 동작 검증.

### 성공 기준 (Success Criteria) — 정량 우선
1. `tooling/k8s/` 에 apps/api·worker + postgres·redis manifest 존재 (Deployment/Service/ConfigMap/Secret 예시).
2. 로컬 클러스터(kind 등)에 apply → apps/api `/health` readiness 그린, worker 기동 로그 확인.
3. Settings 의 k8s manifest drift 검출(이미 backend/settings 에서 동작)과 정합 — 샘플 manifest 가 drift 검사 통과.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

### spec-25-01 — k8s-manifest-example

- **요점**: `tooling/k8s/` apps/api / apps/worker / postgres / redis sample manifest + 로컬 클러스터 기동 확인.
- **방향성**: Deployment/Service/ConfigMap/Secret 최소 예시. ghcr.io 이미지(phase-14 docker publish 산출) 참조. kind 로 로컬 검증.
- **연관 모듈**: `tooling/k8s/`, `apps/api`, `apps/worker`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 로컬 클러스터 | kind / minikube / k3d | 미정 | spec 착수 시 결정 |
| manifest 도구 | 순수 YAML / kustomize / helm | 우선 순수 YAML | 예제 단순성 — helm 은 필요 시 후속 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: k8s apply 후 헬스 그린
- **Given**: spec-25-01 머지됨, 로컬 클러스터 기동.
- **When**: `kubectl apply -f tooling/k8s/`.
- **Then**: apps/api `/health` readiness 200, worker 기동.

## 🔗 의존성
- **선행 phase**: phase-14 (docker publish) + phase-10 (tooling docker).
- **외부 시스템**: 로컬 k8s(kind/minikube), GHCR.
- **연관 ADR**: 0002 (changesets, pnpm)

## 🏁 Phase Done 조건
- [ ] spec-25-01 merge
- [ ] 성공 기준 3개 충족
- [ ] 통합 시나리오 PASS
- [ ] 사용자 최종 승인
