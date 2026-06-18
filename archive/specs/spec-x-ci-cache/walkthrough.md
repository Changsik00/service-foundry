# Walkthrough: spec-x-ci-cache

> CI 캐시 추가 (turbo + playwright).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| turbo 캐시 위치 | `.turbo` / remote cache | **`.turbo` (actions/cache)** | 로컬 캐시로 충분, 원격(Vercel/자체)은 후속 |
| turbo 캐시 키 | 고정 / sha+restore-keys | **`turbo-${os}-${sha}` + restore-keys** | sha 별 저장 + 직전 복원 → 항상 최신 부분캐시 활용 |
| playwright 키 | sha / lockfile 해시 | **lockfile 해시** | 브라우저 버전은 playwright 버전에 종속 → 불필요한 재다운로드 방지 |

## 💬 사용자 협의

- **주제**: CI 가 느림 → 캐시 설정
  - **합의**: turbo 태스크 캐시 + playwright 브라우저 캐시 추가, spec-x 로 진행(PR CI 가 곧 검증).

## 🧪 검증 결과

- **YAML 문법**: ✅ verify.yml·e2e.yml `yaml.parse` 통과.
- **실 검증**: PR CI 로 — 1회차 그린(캐시 채움) → 2회차 캐시 적중(turbo FULL TURBO + playwright 복원) 시간 단축 관찰.

## 🔍 발견 사항

- pnpm store 는 이미 `setup-node` `cache: pnpm` 으로 캐시됨 → 병목은 turbo 태스크 재실행 + playwright 다운로드였음.
- `e2e.yml` 은 `turbo run` 미사용(직접 `--filter` 실행)이라 turbo 캐시 불필요 → playwright 캐시만 적용.

## 🚧 이월 항목

- Turborepo Remote Cache 도입(원격 공유) → 후속.
- `release.yml` docker 레이어 캐시(`docker/build-push-action` gha) → 후속.
