# spec-x-ci-cache: CI 캐시 추가 (turbo + playwright)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-ci-cache` |
| **Branch** | `spec-x-ci-cache` |
| **상태** | Planning |
| **타입** | chore |
| **작성일** | 2026-06-17 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

3개 워크플로(`verify.yml`·`e2e.yml`·`release.yml`) 모두 `actions/setup-node` 의 `cache: pnpm` 으로 **의존성 다운로드(pnpm store)는 캐시**된다. 그러나:
- `verify.yml` 의 `turbo run knip depcruise` + `turbo run lint typecheck test build` 가 **매 실행 처음부터 재실행** — turbo 태스크 출력 캐시가 CI 에 없음.
- `e2e.yml` 의 `playwright install ... chromium` 이 **매 실행 브라우저 재다운로드**.

### 문제점

CI 가 변경과 무관한 부분까지 매번 전부 재실행해 느리다.

### 해결 방안

`actions/cache` 로 ① turbo 로컬 캐시(`.turbo`)를 워크플로 간/실행 간 복원, ② Playwright 브라우저(`~/.cache/ms-playwright`)를 캐시해 변경 없는 작업을 스킵한다.

## 요구사항

1. `verify.yml` 에 `.turbo` 캐시 스텝 추가 (turbo 가 default `.turbo/cache` 사용 → 변경 없는 태스크 캐시 적중).
2. `e2e.yml` 에 `~/.cache/ms-playwright` 캐시 스텝 추가 (`playwright install` 앞).
3. 결정론 유지: 캐시는 **속도 최적화일 뿐 정확성에 영향 없어야** 함 (lockfile/소스 변경 시 turbo 해시가 자동 무효화).

## Out of Scope

- Turborepo **Remote Cache**(Vercel/자체 서버) — 로컬 `actions/cache` 로 충분, 원격은 후속.
- `release.yml` docker 레이어 캐시(`docker/build-push-action` gha cache) — 별개 최적화, 빈도 낮음. 후속 후보.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **turbo 캐시** | `actions/cache` path `.turbo`, key `turbo-${os}-${sha}`, restore-keys `turbo-${os}-` | sha 별 저장 + 직전 캐시 복원 → 변경 없는 태스크 스킵 |
| **playwright** | `actions/cache` path `~/.cache/ms-playwright`, key=lockfile 해시 | 브라우저 버전은 playwright 버전(lockfile)에 종속 |

## Proposed Changes

#### [MODIFY] `.github/workflows/verify.yml`
`Install` 다음, 첫 `turbo run` 앞에 turbo 캐시 스텝 추가:
```yaml
- name: Turbo cache
  uses: actions/cache@v4
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ github.sha }}
    restore-keys: |
      turbo-${{ runner.os }}-
```

#### [MODIFY] `.github/workflows/e2e.yml`
`Install Playwright browsers` 앞에 캐시 스텝 추가:
```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      playwright-${{ runner.os }}-
```

## 검증 계획

```bash
# 로컬: YAML 문법 확인 (actionlint 있으면)
# 실제 검증은 PR 의 CI 실행으로 — 2회차(캐시 적중) 시간 단축 확인
```

수동 검증 시나리오:
1. PR 생성 → CI 1회차(캐시 미스, 채움) 정상 통과
2. 빈 커밋/재실행 2회차 → turbo "FULL TURBO"(캐시 적중) + playwright 캐시 복원으로 시간 단축

## ✅ Definition of Done

- [ ] verify.yml turbo 캐시 + e2e.yml playwright 캐시 추가
- [ ] PR CI 통과 (1회차 그린)
- [ ] 2회차 캐시 적중으로 시간 단축 확인 (PR 코멘트/관찰)
- [ ] `walkthrough.md`(spec-x 는 생략 가능) — queue.md done 갱신은 `sdd specx done`
- [ ] `spec-x-ci-cache` 브랜치 push + PR
