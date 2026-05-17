# ADR-002: 모노레포 기반 (Monorepo Foundations)

* 상태: 채택됨
* 날짜: 2026-05-17
* 스코프: 저장소 툴체인 베이스라인 (패키지 매니저, 오케스트레이터, 런타임, hook, 버전 관리)

---

# 배경

AI-first Node/TS 모노레포를 구축한다 (ADR-001 참고). 어떤 패키지나 앱을 작성하기 전에 기반 레이어가 먼저 잠겨야 한다. 이 도구들은 이후 모든 결정의 게이트가 된다.

제약:

* apps + 라이브러리를 한 저장소에 담는다
* 향후 MSA 진화 경로가 계획되어 있다 (별도 ADR)
* CI 성능이 1급 시민이다
* dev/CI 간 재현 가능한 설치
* "안정성 안에서의 최신 트렌드" — 모던하되 첨단은 아니다

---

# 결정

```txt
Package manager:  pnpm 11.1.2 (catalogs enabled)
Orchestrator:     turborepo (latest 2.x)
Runtime:          Node 22 LTS
Module system:    ESM only (NodeNext)
Commit hooks:     lefthook
Versioning:       changesets
```

루트 `package.json` (`packageManager`, `engines.node`)과 루트 devDependencies로 고정한다.

---

# 세부 결정

## 1. 패키지 매니저 — pnpm 11 + catalogs

### 결정

pnpm `^11.0.0` 사용 (`packageManager` 필드로 11.1.2에 고정). `pnpm-workspace.yaml`의 `catalog:` 프로토콜로 공유 의존성 버전을 중앙화한다.

```yaml
packageManager: pnpm@11.1.2
packages:
  - "apps/*"
  - "packages/*/*"
catalog:
  # runtime
  zod: ^4.4.3
  pino: ^10.3.1
  # types
  "@types/node": ^22.19.19
  # toolchain
  typescript: ^6.0.3
  tsx: ^4.22.1
  "@biomejs/biome": ^2.4.15
  vitest: ^4.1.6
  tsup: ^8.5.1
  knip: ^6.14.1
  dependency-cruiser: ^17.4.0
  turbo: ^2.9.14
  lefthook: ^2.1.6
  "@changesets/cli": ^2.31.0
```

패키지는 `"zod": "catalog:"`로 공유 버전을 참조한다. 위 카탈로그는 현재 핀이다 (저장소 부트스트랩 시점, 2026-05-17). Renovate/Dependabot으로 업데이트하고 실제 `pnpm-workspace.yaml`과 lockstep으로 여기 버전을 올린다.

> **컨벤션**: 코드는 *설치된* 버전의 API에 맞춰 작성한다. ADR 예제는 작성 시점의 의도를 문서화한다 — major 버전이 올라가고 API가 바뀌면 코드를 먼저 고친 다음, 여기 예제를 갱신한다. ARCHITECTURE.md §0 참고.

### 이유

* 단일 진실 출처 — syncpack 불필요
* 패키지 간 동일 resolution → CI 캐시 안정성
* Renovate/Dependabot이 N줄이 아닌 1줄만 업데이트
* pnpm 11 GA가 2026년 4월; v10 대비 성능 향상

## 2. 워크스페이스 오케스트레이터 — Turborepo 2.x

### 결정

모든 크로스 패키지 task (`build`, `lint`, `test`, `typecheck`)는 `turbo run`을 거친다. 채택한 패턴은 `docs/turborepo-rules.md`에 문서화한다.

### 이유

* 네이티브 pnpm 워크스페이스 지원
* Task graph, 캐싱, affected 감지
* JSON-only 설정 — 벤더 락인 없음

## 3. 런타임 — Node 22 LTS

### 결정

Node 22 LTS. 루트 `package.json`에 고정:

```json
{ "engines": { "node": ">=22.0.0 <23" } }
```

### 이유

* 2027-04까지 LTS
* 네이티브 ESM, 네이티브 `--watch`, 네이티브 `fetch`
* Turborepo 2.x가 `engines.node`를 글로벌 캐시 키에 해시로 포함
* Node 24는 아님 — 최신보다 안정성

## 4. 모듈 시스템 — ESM only (NodeNext)

### 결정

모든 패키지: `"type": "module"`. tsconfig: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

### 이유

* Node의 장기 방향
* NodeNext가 런타임 resolution 시맨틱과 일치
* 내부 패키지에 듀얼 CJS/ESM 발행 부담 없음

## 5. Commit hook — lefthook

### 결정

`husky + lint-staged` 대신 `lefthook`.

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,jsx,ts,tsx,json,jsonc}"
      run: pnpm exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
    typecheck:
      run: pnpm turbo run typecheck --output-logs=errors-only
```

> Biome 2.x는 `--apply`를 `--write`로 이름을 바꿨다. `typecheck`는 Turborepo를 거치므로 commit 때마다 전체 트리를 재검사하지 않고 패키지별 캐시 혜택을 받는다.

### 이유

* 단일 바이너리 (Go), npm 의존성 체인 없음
* 네이티브 병렬 hook 실행
* 두 도구보다 깔끔한 설정

## 5b. TS 스크립트 러너 — tsx

### 결정

`tsx`는 루트 devDependency (그리고 카탈로그 항목)로 들어간다. `tooling/scripts/*` 아래 비자명한 저장소 스크립트는 모두 TypeScript로 작성하고 다음으로 실행한다:

```bash
pnpm tsx ./tooling/scripts/foo.ts
# or
node --import tsx ./tooling/scripts/foo.ts
```

Bash는 얇은 라이프사이클 글루용으로만 쓴다 (lefthook hook 본문, CI 오케스트레이션). ARCHITECTURE.md §0 참고.

### 이유

* 별도 "스크립트 툴체인"이 필요 없다 — production 코드와 동일한 TS strict 설정
* `tsx`는 현재 생태계에서 가장 작은 실용적인 Node TS 로더다 (ts-node는 우리 유스케이스에서 대체됨)
* ARCHITECTURE §0의 TS-first 원칙과 일치

---

## 6. 버전 관리 — changesets

### 결정

내부 패키지 버전 관리와 changelog 생성은 `@changesets/cli`. `.changeset/*.md`로 PR 시점에 의도를 캡처한다.

### 이유

* pnpm/turborepo 모노레포의 사실상 표준
* 패키지별 독립 버전 관리
* private/public 발행 양쪽 모두 지원

---

# 결과

## 장점

* 재현 가능한 설치
* 빠른 CI (turborepo + pnpm 캐시)
* 모던하되 안정적인 기반
* 각 도구를 독립적으로 교체 가능

## 단점

* pnpm catalogs는 최근 기능 — 일부 niche 도구가 따라오지 못할 수 있음
* lefthook은 husky보다 덜 보편적 — 작은 온보딩 마찰
* Node 22라서 Node 23/24 전용 API는 못 씀

---

# 검토한 대안

| Alternative | Rejected because |
|---|---|
| npm / yarn workspaces | pnpm이 더 빠르고, 더 엄격하며, catalogs를 가짐 |
| nx | 더 무겁고, 더 의견이 강하며, 벤더 결합도 |
| Bun runtime | 프로덕션 백엔드에 쓰기엔 너무 이름 |
| Node 24 (current) | 2026년 말까지 LTS 아님 |
| husky + lint-staged | 두 도구, 두 설정; lefthook이 더 단순함 |
| nx release / lerna | changesets가 더 모던하고 집중된 도구 |

---

# 재검토 기준

* Bun이 안정적인 프로덕션 동등성에 도달 → 런타임 재고
* pnpm v12에 실질적 변화 → 업그레이드 계획
* Turborepo가 실질적으로 더 나은 무언가로 대체됨

---

# 관련 문서

* [ADR-001](./0001-linting-formatting-strategy.md) — Linting / formatting
* [ADR-003](./0003-package-layout-and-naming.md) — Package layout & naming
* [ADR-004](./0004-typescript-and-compilation-strategy.md) — TS & compilation
* `docs/turborepo-rules.md` — 파생 규칙의 원천
