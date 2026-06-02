# Implementation Plan: spec-14-01

## 📋 Branch Strategy
- 신규 브랜치: `spec-14-01-ci-verify-gate`
- 시작 지점: `phase-14-quality-cicd`
- 첫 task 가 브랜치 생성

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **게이트 코어 범위**: frozen-lockfile + turbo lint/typecheck/test/build. knip/depcruise 는 루트 미배선 → 후속.
> [!WARNING]
> - [ ] verify 워크플로는 **모든 PR(전체 base)** 에서 실행 — 향후 phase/spec PR 마다 CI 분 소비.

## 🎯 핵심 전략

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 트리거 | `pull_request`(전체) + `push`(main) | spec→phase, phase→main 모든 PR 보호 |
| 설치 | `--frozen-lockfile` | lockfile 누락(#83)류 결정론적 차단 |
| 검증 | `turbo run lint typecheck test build` | #80 typecheck 누수 차단 + 빌드까지 |
| 버전 | pnpm 11.1.2 / node 24 (repo 일치) | 환경 drift 방지 |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

### [NEW] `.github/workflows/verify.yml`
```yaml
name: verify
on:
  pull_request:
  push:
    branches: [main]
concurrency:
  group: verify-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4         # packageManager(pnpm@11.1.2) 자동 사용
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint typecheck test build
```
> 액션 버전은 현행 major 핀. 빌드 캐시는 setup-node 의 pnpm store 캐시만(turbo remote 후속).

## 🧪 검증 계획
### 로컬 동등 검증
```bash
pnpm install --frozen-lockfile
pnpm turbo run lint typecheck test build   # 전부 green 확인
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/verify.yml'))"  # YAML 유효
```
### 통합 (Integration Test Required = yes)
- 본 PR push → GitHub Actions `verify` 잡이 트리거되어 **green** 인지 확인(워크플로 자기 검증).
- (선택) 일부러 깨진 커밋으로 red 확인은 후속/수동.

## 🔁 Rollback Plan
- `.github/workflows/verify.yml` 삭제. 다른 코드 영향 0.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] verify.yml + 로컬 동등 그린
- [ ] 본 PR CI green 확인
- [ ] walkthrough / pr_description ship
