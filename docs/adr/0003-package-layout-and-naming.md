# ADR-003: 패키지 레이아웃 & 네이밍 컨벤션

* 상태: 채택됨
* 날짜: 2026-05-17
* 스코프: 폴더 구조, npm scope, 패키지 및 도구 설정 네이밍

---

# 배경

이 모노레포는 config / shared / backend / frontend / testing 레이어에 걸쳐 수십 개 패키지를 담게 된다. flat 레이아웃은 ~10개 패키지를 넘어가면 관리 불가능해진다. 여러 npm scope (`@backend/*`, `@frontend/*`)는 Turborepo 컨벤션을 깨고 발행을 복잡하게 만든다.

목표:

* 쉬운 파일 시스템 탐색
* 단일·예측 가능한 import scope
* 리팩토링 친화 — 패키지를 카테고리 간에 옮겨도 import가 깨지지 않는다
* Turborepo의 워크스페이스 기대치와 호환
* 강제 가능한 의존성 경계 (frontend → backend 금지 등)

---

# 결정

```txt
npm scope:           @repo/*  (single)
Folder layout:       packages/<category>/<pkg>
Categories:          config, shared, backend, frontend, testing
Workspace glob:      ["apps/*", "packages/*/*"]
Tool config naming:  *-config suffix
Import path:         @repo/<pkg>   (flat — category never appears in scope)
```

---

# 세부 결정

## 1. npm scope — 단일 `@repo/*`

### 결정

모든 내부 패키지는 `@repo/<pkg-name>` 사용. `@backend/`, `@frontend/`, `@shared/` 없음.

### 이유

* Turborepo 공식 예제가 `@repo/*` 사용
* npm scope는 조직 식별자이지 카테고리 분류가 아니다
* 균일한 `pnpm` 필터, 제너레이터 템플릿, codemod
* 나중에 실제 org scope가 필요하면 글로벌 rename 쉬움

## 2. 폴더 레이아웃 — 카테고리 그룹화

### 결정

```
packages/
  config/    # tool configs (biome-config, typescript-config, ...)
  shared/    # FE+BE-safe (contracts, errors, validation, utils)
  backend/   # Node-only (settings, logger, http-client, auth, ...)
  frontend/  # browser-only (ui, sdk, auth)
  testing/   # test helpers, fixtures
```

각 `packages/<category>/<pkg>/`는 자체 `package.json`을 가진 실제 워크스페이스 패키지다. **카테고리 폴더 자체에는 `package.json`이 있으면 안 된다** (Turborepo 워크스페이스 resolution 요건; `docs/turborepo-rules.md`에서 확인됨).

### 이유

* 파일 탐색기에서 카테고리가 즉시 보임
* 리팩토링: 폴더를 옮겨도 import (`@repo/<pkg>`)는 유지 — consumer 전반에 걸친 rename 불필요
* dependency-cruiser가 카테고리 수준에서 규칙을 걸 수 있음 (`frontend/** cannot import backend/**`)

## 3. 워크스페이스 글롭 — `packages/*/*`

### 결정

```yaml
packages:
  - "apps/*"
  - "packages/*/*"
```

### 이유

* 카테고리 구조와 일치
* 카테고리 디렉토리에 `package.json`이 없는 한 동작함을 Turborepo로 확인

## 4. 도구 설정 네이밍 — `*-config` suffix

### 결정

툴체인 설정을 제공하는 모든 패키지는 `*-config` suffix를 사용한다:

```
@repo/biome-config
@repo/typescript-config
@repo/vitest-config
@repo/tsup-config
@repo/knip-config
@repo/depcruise-config
```

`@repo/config-biome` (prefix) 아님.

### 이유

* Turborepo 공식 예제 (`@repo/eslint-config`, `@repo/typescript-config`)가 suffix 사용
* npm 생태계 컨벤션 (`eslint-config-airbnb` 등)
* IDE에서 알파벳 정렬·그룹화가 잘 됨

## 5. import 경로는 flat 유지

### 결정

카테고리는 폴더 경로에만 존재한다. import는 항상 `@repo/<pkg>`. 절대 `@repo/backend/<pkg>` 아님.

### 이유

* 카테고리 변경이 import 사이트를 깨지 않음
* 더 짧은 import
* Turborepo / pnpm / TS resolution 기본값과 호환

## 6. 카테고리 배치 규칙

* 명확한 backend (Node 전용 API)? → `backend/`
* 명확한 browser (DOM/React)? → `frontend/`
* 둘 다? → `shared/` — 기본적으로 browser-safe 해야 함
* 도구 설정 → `config/`
* 테스트 유틸 / fixture / harness → `testing/`
* 애매할 때 → `shared/` 선호, 강제될 때 나중에 분리

server/client 분기가 1일차부터 확실한 경우에만 사전 분리 허용.

### 잠긴 예외

`auth`는 1일차부터 3패키지로 분리: `shared/auth-contracts` + `backend/auth` + `frontend/auth`. server/client 분기가 사실상 확실하다.

`logger`는 frontend 로깅이 실제 요구사항이 되기 전까지 단일 `backend/logger`로 유지 (lazy split).

---

# 결과

## 장점

* 탐색 가능하고 즉시 grep 가능한 구조
* import가 리팩토링을 견딤
* 단일 scope가 Turborepo / npm / 제너레이터를 단순하게 유지
* 강제 가능한 경계 규칙

## 단점

* 폴더 레벨이 하나 더 추가됨 (IDE에서 경로가 약간 길어짐)
* 새로 합류한 사람은 새 패키지를 어디 둘지 알려면 이 문서가 필요
* `packages/*/*`는 기술적으로 중첩 구조 — 일부 오래된 도구가 처리 못 할 수 있음 (잠긴 스택에는 해당 없음)

---

# 검토한 대안

| Alternative | Rejected because |
|---|---|
| Multiple npm scopes (`@backend/x`, `@frontend/x`) | Turborepo 컨벤션을 깨고, 발행을 복잡하게 하며, 리팩토링에 적대적 |
| Flat `packages/*` | ~10개 넘어가면 패키지 벽이 됨 |
| `config-*` prefix | aiagent-monorepo 스타일; Turborepo 대비 비표준; ESLint의 역사적 `*-config` 검색 컨벤션과 충돌 |
| Encode category in package name (`@repo/be-logger`) | 장황한 import, 파일 탐색기에 도움 안 됨, 리팩토링에 적대적 |

---

# 재검토 기준

* 카테고리가 5개를 넘어감 — 스키마 재고
* 우리가 채택할 도구가 `packages/*/*` 글롭을 처리 못 함 — 재고
* public npm 발행 — scope rename

---

# 관련 문서

* [ADR-002](./0002-monorepo-foundations.md) — Foundations
* [ADR-004](./0004-typescript-and-compilation-strategy.md) — TS & compilation
