# ADR-004: TypeScript & Compilation Strategy

* 상태: 채택됨
* 날짜: 2026-05-17
* 스코프: TypeScript 설정, 패키지 컴파일, dist 출력

> [!NOTE]
> 본문의 `apps/web-vite` 전제는 [ADR-0025](./0025-frontend-app-consolidation.md)(frontend 앱 단일화, 2026-06-10)로 대체됨.

---

# 배경

TypeScript 레이아웃에 대한 결정(project references? 루트 tsconfig? `paths`?)과 패키지별 컴파일(`tsc` / `tsup` / 빌드 없음?)은 모든 패키지에 파급된다. Turborepo 공식 문서(`docs/turborepo-rules.md`에 정리됨)는 특정 패턴을 권장한다. 우리 스택의 특수성에 맞게 그것들을 채택한다.

목표:

* "새 패키지 어떻게 추가하나?"에 대한 기계적인 규칙
* ESM/NodeNext 런타임에 정직하게 맞추기
* Turborepo 캐시 효율 극대화
* `paths`, project references, dual CJS/ESM 발행의 알려진 함정 회피

---

# 결정

```txt
TS config:    @repo/typescript-config (presets only)
              Each package extends a preset
              No root tsconfig.json
              No project references
              No `paths` mapping  (use Node subpath imports if needed)
              strict: true everywhere

ESM:          "type": "module" everywhere
              "module": "NodeNext", "moduleResolution": "NodeNext"

Compilation:
   Compiled (tsup):  apps/api, apps/worker, all packages/backend/*
   JIT (TS source):  packages/shared/*, packages/frontend/*,
                     packages/testing/*, packages/config/*
```

---

# 세부 결정

## 1. `@repo/typescript-config`는 프리셋만 제공

### 결정

해당 패키지는 `files`와 `exports` 필드를 통해 tsconfig JSON 프리셋을 내보낸다:

```json
{
  "name": "@repo/typescript-config",
  "files": ["base.json", "library.json", "node-app.json", "react-app.json"]
}
```

소비 패키지는 프리셋을 선택한다:

```jsonc
// packages/shared/contracts/tsconfig.json
{ "extends": "@repo/typescript-config/library.json" }
```

### 이유

* 컴파일러 옵션의 SoT 단일화
* 각 패키지는 실제 로컬 tsconfig를 유지 — 마법 없음
* Turborepo 공식 패턴과 일치

## 2. 루트 `tsconfig.json` 없음

### 결정

리포지토리 루트에는 `tsconfig.json`이 **없다**.

### 이유

* Turborepo 문서가 명시적으로 권장하지 않음
* 에디터에서 암묵적인 "open project" 포함을 방지
* 어떤 설정이 어떤 파일을 지배하는지에 대한 혼란 제거

## 3. TS project references 없음

### 결정

어떤 tsconfig에도 `references` 필드를 두지 않는다.

### 이유

* pnpm workspace에 이미 표현된 의존성 그래프를 중복시킴
* Turborepo와 함께 쓸 때 미묘한 빌드 순서 문제를 유발
* 패키지가 이동할 때 유지보수 비용
* Turborepo 문서가 명시적으로 권장하지 않음

## 4. `paths` 매핑 없음

### 결정

tsconfig에 `"paths"`를 두지 않는다. 패키지 간 import는 패키지명(`@repo/<pkg>`)을 사용한다. 패키지 내부: 상대 경로 또는 — 큰 경우 — Node subpath imports(`package.json`의 `imports`를 통해 `#internal/*`).

### 이유

* `paths`는 타입 체크에만 영향을 주고 런타임에는 영향이 없음 — 취약함
* dev/런타임 해석 일관성을 강제
* NodeNext 시맨틱과 정렬

## 5. `strict: true` 어디서나

### 결정

모든 프리셋은 `"strict": true`를 활성화하고, 추가로:

* `noUncheckedIndexedAccess: true`
* `exactOptionalPropertyTypes: true`
* `noImplicitOverride: true`
* `noFallthroughCasesInSwitch: true`
* `noImplicitReturns: true`
* `verbatimModuleSyntax: true` — `isolatedModules: true`와 짝지어 모든 파일이 import/export 시맨틱을 문자 그대로 명시하도록 함 (ESM 친화적; 번들러 독립적인 JIT `.ts` 소스 export에 필요)
* `isolatedModules: true`

### 이유

* ADR-001은 무거운 lint 규칙 대신 strict 타입을 사용함
* AI 생성 코드는 strict 체크에서 큰 이득을 봄
* Biome 규칙으로 잡을 수 없는 버그를 잡음

## 6. ESM only — NodeNext 해석

### 결정

`"type": "module"` 어디서나. `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

### 이유

* ADR-002 §4 참조
* NodeNext는 Node의 런타임 해석을 가장 정확하게 매치함

## 7. 컴파일 분리 — 백엔드는 컴파일, 프론트엔드/shared는 JIT

### 결정

| Category | Mode | Tooling |
|---|---|---|
| `packages/config/*` | JIT (`.ts` / `.json` / `.cjs`) | Node로 config를 로드하는 도구가 소비함 — `.ts`는 tsx-importable, JSON은 JSON 전용 도구(Biome, Knip)용, `.cjs`는 ESM을 거부하는 도구에만 사용(v17 기준 dependency-cruiser) |
| `packages/shared/*` | JIT (TS 소스 export) | — |
| `packages/frontend/*` | JIT | (번들러가 컴파일) |
| `packages/testing/*` | JIT | — |
| `packages/backend/*` | **Compiled** | tsup → `dist/` |
| `apps/api`, `apps/worker` | 배포 시 컴파일 | tsup 또는 프레임워크 빌드 |
| `apps/web-next`, `web-vite`, `admin` | 번들러로 컴파일 | Next / Vite |

> **config 패키지의 TS-우선 컨벤션**: 비자명한 로직이 있는 것은 `.ts`(소비 도구가 tsx로 로드)를 선호 — vitest 프리셋, tsup 프리셋, 제너레이터 스크립트. JSON은 요구하는 도구에만 사용(Biome, Knip, tsconfig 자체). `.cjs`는 ESM을 로드할 수 없는 도구의 탈출구로만 사용. ARCHITECTURE §0 참조.

컴파일된 패키지는 `exports`에서 dist를 참조한다:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

JIT 패키지는 소스를 직접 export한다:

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### 이유

* Node 런타임 소비자는 커스텀 로더 없이 `.ts`를 직접 import할 수 없음 → 컴파일된 출력을 소비해야 함
* 번들러가 소비하는 패키지는 TS 소스를 받을 수 있음 — 번들러가 처리
* 이것이 Turborepo의 공식 "컴파일 vs JIT" 권장
* 컴파일된 백엔드 패키지는 `dist/`에 대한 Turborepo 캐시 이득을 봄
* JIT 패키지는 빌드 스텝이 0 — 빠른 반복

## 8. tsup config 베이스라인

### 결정

`@repo/tsup-config`는 백엔드 패키지를 위한 단일 프리셋을 제공하며, 각 소비자가 오버라이드할 수 있도록 파라미터화된다:

```ts
import { defineConfig, type Options } from "tsup";

export const nodeLibPreset = (overrides: Partial<Options> = {}): Options =>
  defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    minify: false,
    ...overrides,
  }) as Options;
```

### 이유

* 단일 ESM 출력 — dual 발행 없음
* `dts: true` — 타입이 패키지와 함께 배포됨
* Treeshake가 소비자의 트리 셰이킹을 보존

---

# 결과

## 장점

* 새 패키지에 대한 기계적인 결정 트리
* 에디터 혼란 없음 (루트 tsconfig 없음)
* 캐시 친화적 (dist는 해시 가능, JIT는 캐시할 빌드가 없음)
* strict 타입이 테스트 이전에 대부분의 AI 오류를 잡음

## 단점

* 백엔드 패키지 작성자는 빌드(또는 `tsup --watch`)를 돌려야 함 — JIT보다 무거움
* `tsc --build` 없음 (project references 없음) — Turborepo 태스크 그래프에 의존
* JIT TS 소스 export는 소비자가 raw Node이면 깨짐 — 우리 소비자(Vitest, Vite, Next, tsup)에는 보편적으로 괜찮으나, 외부 CJS Node 스크립트에서는 깨짐

## 완화책

* `apps/api`(Node 런타임)는 `packages/backend/*`(컴파일됨)를 import → 안전
* `apps/web-*`(번들러)는 `packages/shared/*`와 `packages/frontend/*`(JIT)를 import → 안전
* 테스트는 Vitest로 실행 → JIT 소비 OK

---

# 검토한 대안

| Alternative | Rejected because |
|---|---|
| TS project references | pnpm 그래프 중복, 빌드 순서 함정, Turborepo가 그래프를 다룸 |
| Root tsconfig with `paths` | 에디터 포함 함정; `paths`는 런타임 아님 — Turborepo가 권장하지 않음 |
| `tsc` instead of `tsup` for backend | 더 느림, dts 번들링 없음, 트리 셰이크 힌트 없음 |
| Compile every package | shared/frontend(번들러 소비)에 낭비적 |
| Leave every package JIT | Node 런타임 소비자가 깨짐 |
| Dual CJS/ESM output | 우리는 신규 — CJS 소비자가 존재하지 않음 |

---

# 재검토 기준

* 외부 CJS 소비자를 위해 백엔드 패키지를 npm에 발행 → dual 발행 재검토
* TS가 Turborepo를 그래프 측면에서 대체하는 일급 "workspace" 기능을 추가 → 재검토
* 우리가 의존하는 번들러가 TS 소스 지원을 중단 → JIT 재검토

---

# 관련 문서

* [ADR-002](./0002-monorepo-foundations.md) — Foundations
* [ADR-003](./0003-package-layout-and-naming.md) — Package layout & naming
* `docs/turborepo-rules.md` — 이 결정들의 출처
