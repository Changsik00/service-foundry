# phase-14: Quality Hardening + CI/CD

> 보일러플레이트 품질·완성도 트랙 4번째. 코드 품질 평점 상향(에러 A-→A, 보안 B+→A) + 반복 가능한 PR 검증/릴리스 파이프라인.
> 2026-05-31 결정: #80 사고(로컬 훅·turbo 캐시로 latent typecheck/lockfile 누수 미차단)를 근거로 CI 전체를 phase-14 로 당김. phase-15 는 deploy(k8s)만 잔류.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-14` |
| **상태** | In Progress |
| **시작일** | 2026-05-31 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-14-quality-cicd` |

## 🎯 배경 및 목표

### 현재 상황
런타임(11/12)·API/데이터(13) 기반은 갖췄으나 (a) 에러 처리 규약이 패키지마다 제각각(Result/throw/boolean 혼재), (b) auth.guard 가 미검증 클레임을 읽는 footgun, (c) 비-auth 패키지 경계 테스트 부족, (d) general rate-limit/secrets provider 부재, (e) **PR 검증 자동화 부재로 #80 같은 불완전 머지/lockfile 누락이 실제 발생**.

### 목표 (Goal)
코드 품질 평점을 끌어올리고(에러 A-→A, 보안 B+→A), 그 품질을 **결정론적으로 강제하는 CI 게이트 + 릴리스 파이프라인**을 구축한다.

### 성공 기준 (Success Criteria) — 정량 우선
1. **에러 규약 통일** — Result/throw/boolean 정책을 ADR 로 확정 + 위반 지점 리팩터, 회귀 테스트.
2. **auth.guard verified-claims** — role 을 `result.value`(검증된 클레임)에서만 읽도록 수정, footgun 테스트.
3. **비-auth 경계 테스트** — http-client/logger/utils 경계·에러 경로 테스트 보강(측정 가능한 커버리지 증가).
4. **보안 포트** — general rate-limit 포트 + secrets provider 포트(+ in-memory/env 어댑터), 단위 테스트.
5. **CI PR 검증 게이트** — GitHub Actions: `pnpm install --frozen-lockfile` + turbo typecheck/test/lint + knip + depcruise. PR 에서 #80·lockfile 누락류 결정론적 차단.
6. **릴리스 자동화** — changesets 기반 release PR + 변경 패키지 버전/changelog + (apps) docker image build/publish.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| `spec-14-01` | ci-verify-gate | P? | Merged | `specs/spec-14-01-ci-verify-gate/` |
| `spec-14-02` | error-convention | P? | Merged | `specs/spec-14-02-error-convention/` |
| `spec-14-03` | auth-guard-verified-claims | P? | Merged | `specs/spec-14-03-auth-guard-verified-claims/` |
| `spec-14-04` | boundary-tests | P? | Merged | `specs/spec-14-04-boundary-tests/` |
<!-- sdd:specs:end -->

### spec-14-01 — ci-verify-gate (우선)
- **요점**: GitHub Actions PR 워크플로 — frozen-lockfile + turbo typecheck/test/lint + knip + depcruise. **나머지 spec 의 안전망이라 먼저 박는다**(#80 재발 차단).
- **연관 모듈**: `.github/workflows/`, `turbo.json`, knip/depcruise config

### spec-14-02 — error-convention
- **요점**: 에러 처리 규약 ADR(Result vs throw vs boolean 경계) + 위반 리팩터.
- **연관 모듈**: `packages/shared/errors`, 각 패키지 에러 경로, `docs/decisions/`

### spec-14-03 — auth-guard-verified-claims
- **요점**: `nestjs-auth` guard 가 role 을 검증된 클레임(`result.value`)에서 읽도록 수정 + footgun 회귀 테스트.
- **연관 모듈**: `packages/nestjs/auth`

### spec-14-04 — boundary-tests
- **요점**: 비-auth 패키지(http-client/logger/utils) 경계·에러 경로 테스트 보강.
- **연관 모듈**: `packages/{backend,frontend}/http-client`, `backend/logger`, `shared/utils`

### spec-14-05 — security-ports
- **요점**: general rate-limit 포트 + secrets provider 포트(+ env/in-memory 어댑터). 보안 baseline B+→A.
- **연관 모듈**: `packages/backend/` (신규 rate-limit / secrets)

### spec-14-06 — ci-release-docker
- **요점**: changesets release PR + docker image build/publish(apps/api·worker).
- **연관 모듈**: `.github/workflows/`, `.changeset/`, `apps/*/Dockerfile`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| CI 배치 | 15 유지 / 14 로 당김 | **14 로 (전체)** | #80 사고 — PR 게이트가 결정론적 차단 (사용자 결정 2026-05-31) |
| spec 순서 | 품질 먼저 / 게이트 먼저 | **게이트(14-01) 먼저** | 나머지 작업의 안전망 |
| 에러 규약 | Result 단일 / 혼재 허용 | spec-14-02 진입 시 | ADR 로 확정 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: CI 게이트가 결함을 잡는다
- **Given**: spec-14-01 머지 후.
- **When**: 의도적으로 typecheck 실패/lockfile 불일치 PR.
- **Then**: CI 가 red → 머지 차단.
- **연관 SPEC**: spec-14-01

### 시나리오 2: 릴리스 PR 생성
- **Given**: spec-14-06 머지 + changeset 추가.
- **When**: main 푸시.
- **Then**: release PR 자동 생성(버전/changelog).
- **연관 SPEC**: spec-14-06

## 🔗 의존성
- **선행 phase**: phase-11~13.
- **연관 ADR**: ADR-0009(AppError), ADR-0015, ADR-0019(보안 linter No-Go — CI 에서 재평가).
- **후속**: phase-15 (deploy / k8s manifest — CI 분리 후 잔류분).

## 📝 위험 요소 및 완화
| 위험 | 영향 | 완화책 |
|---|---|---|
| CI 러너 비용/시간 | 느린 PR | turbo remote cache 없이도 affected-only, 최소 게이트부터 |
| 에러 규약 리팩터 범위 폭주 | 일정 | ADR 로 경계 확정 후 위반만 수정 |
| docker publish 시크릿 | 보안 | GitHub OIDC/secrets, 평문 금지 |

## 🏁 Phase Done 조건
- [ ] 모든 SPEC 이 `phase-14-quality-cicd` → main merge
- [ ] 통합 시나리오 PASS
- [ ] 성공 기준 측정 결과 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값 -->
