---
difficulty: 중
aliases: ["CI 검증 게이트", "verify workflow", "PR 게이트"]
tags: [service-foundry, explainer, platform, ci]
---

# CI 검증 게이트 — frozen-lockfile + turbo 병렬 lint/typecheck/test/build PR 게이트

> **대상**: CI 파이프라인이 어떻게 로컬에서 놓친 결함을 잡는지 이해하려는 개발자
> **연관 문서**: [[reference/architecture]] · [[monorepo-build-turbo-tsup]] · [[ci-release-changesets-docker]]

## 왜 필요한가

로컬에서는 turbo 캐시와 이미 빌드된 아티팩트, 빠른 머신으로 결함이 숨는다. PR #80에서 `git commit | tail`이 종료 코드를 가려 불완전 머지가 발생한 사례처럼, clean 환경에서만 드러나는 회귀가 있다. `verify.yml`은 매 PR/main push마다 완전히 새로운 환경에서 동일한 명령을 실행해 이를 차단한다.

## 어떻게 동작하나

```mermaid
flowchart TD
    PR["PR 오픈 / main push"] -->|on: pull_request / push| WF["verify 워크플로<br/>ubuntu-latest"]

    WF --> CHECKOUT["actions/checkout@v4"]
    CHECKOUT --> PNPM["pnpm/action-setup@v4<br/>(packageManager 필드 자동 사용)"]
    PNPM --> NODE["actions/setup-node@v4<br/>node-version: 24, cache: pnpm"]

    NODE --> PG["postgres:16-alpine 서비스 컨테이너<br/>:5434 / POSTGRES_DB=test<br/>healthcheck 10회 대기"]

    NODE --> INSTALL["pnpm install --frozen-lockfile<br/>(lockfile drift 즉시 차단)"]
    INSTALL --> MIGRATE["pnpm --filter @apps/api db:migrate<br/>(e2e 테이블 준비)"]
    MIGRATE --> TURBO["pnpm turbo run lint typecheck test build<br/>(129 task 병렬 실행)"]

    TURBO -->|all pass| GREEN["✅ 게이트 통과"]
    TURBO -->|any fail| BLOCK["❌ PR 차단"]

    subgraph "CI가 잡은 결함 (spec-14-01)"
        E1["ERR_PNPM_IGNORED_BUILDS<br/>미승인 build script → allowBuilds: false"]
        E2["NOTIFIER 단위버그<br/>mock 누락 → 테스트 8개 실패"]
        E3["crypto 타임아웃<br/>bcrypt/argon2 2-core 러너 5s 초과<br/>→ vitest testTimeout 30s"]
        E4["routeTree.gen.ts 부재<br/>web-vite gitignored 생성파일<br/>→ typecheck→build 의존 추가"]
    end
```

### frozen-lockfile의 역할

`pnpm install --frozen-lockfile`은 `pnpm-lock.yaml`과 불일치하는 `package.json`이 있으면 즉시 에러를 낸다. 로컬에서 의존성을 추가하고 lockfile 커밋을 빠뜨리면 CI가 차단한다.

### postgres 서비스 컨테이너

apps/api의 e2e 테스트(`auth.e2e.test.ts`)는 실제 postgres가 필요하다. GitHub Actions `services` 블록으로 컨테이너를 제공하고, `DATABASE_URL=postgres://postgres:test@localhost:5434/test`로 연결한다. redis는 throttler가 in-memory 모드를 사용하므로 불필요하다.

### concurrency cancel-in-progress

동일 ref에 여러 push가 쌓이면 이전 실행을 취소한다. PR 빠른 연속 push 시 불필요한 실행을 줄인다.

## 용어 정리

| 용어 | 설명 |
|---|---|
| `frozen-lockfile` | lockfile이 정확히 일치하지 않으면 install 실패 — drift 탐지 |
| `service container` | GitHub Actions job의 사이드카 컨테이너 — e2e 인프라 제공 |
| `cancel-in-progress` | 동일 ref에서 새 실행이 시작되면 이전 실행을 취소 |
| `turbo run` | 캐시 없는 clean 환경에서 전체 task 그래프 실행 |
| `testTimeout: 30s` | CI 2-core 러너에서 crypto 연산 타임아웃 방지 |

## 동작/테스트 방법

> 🧪 **로컬 동등 명령**:
> ```sh
> pnpm install --frozen-lockfile
> DATABASE_URL=postgres://postgres:test@localhost:5434/test pnpm --filter @apps/api db:migrate
> pnpm turbo run lint typecheck test build --force
> ```
> spec-14-01에서 129/129 task 성공 확인.

> 🧪 **게이트 자기검증**: verify.yml을 추가한 PR 자체가 게이트를 통과하면 자기검증 완료. spec-14-01 PR(run 26701277137, 2m8s)에서 green 확인.

> ⚠️ `pnpm install` 후 `lefthook install`이 `.git` 없는 환경에서 실패하지 않도록 `prepare`에 `|| true` 처리가 필요하다.

## 마치며

CI 게이트는 "로컬에서 빠른 머신 + 캐시로 숨은 회귀"를 clean 환경에서 드러내는 최후 방어선이다. spec-14-01에서 게이트 도입 즉시 4종의 잠재 결함이 발견되어 수정됐다.

## 연결된 개념

- [[monorepo-build-turbo-tsup]] — CI가 실행하는 turbo 파이프라인 구조
- [[ci-release-changesets-docker]] — verify 게이트 통과 후 main에서 실행되는 릴리스 워크플로
- [[docker-compose-local-infra]] — 로컬에서 postgres를 제공하는 인프라 스택
- [[adr/0002-monorepo-foundations]] — pnpm + turbo 채택 근거

> 소스: spec-14-01 walkthrough · `.github/workflows/verify.yml`
