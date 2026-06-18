# service-foundry — 엔지니어링 원칙

> **시스템 구조**(레이어·패키지·의존 그래프·런타임 토폴로지)의 정본은
> [`docs/reference/architecture.md`](./docs/reference/architecture.md) 다. 전체 문서 카탈로그는
> [`docs/index.md`](./docs/index.md), 문서 위치/SSOT 규약은 [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) §2.5.
>
> 이 문서는 **레포 전역 엔지니어링 원칙**(TypeScript-first · "설치 버전 = SoT" · 초기 셋업)만 다룬다 —
> ADR-0002/0004 가 가리키는 정본. 패키지/폴더 구조는 여기에 중복 서술하지 않는다.

## 0. 툴체인 원칙 — TypeScript-first, everywhere

이 레포는 **end-to-end TypeScript**다. 기여자가 untyped JS나 셸 글루로 떨어질 필요가 없는 게 목표.

* **Runtime**: Node 24 LTS, ESM only (`NodeNext`). `engines.node` 는 `>=24.0.0 <25` 로 잠금 ([ADR-0002](./docs/adr/0002-monorepo-foundations.md), [ADR-0004](./docs/adr/0004-typescript-and-compilation-strategy.md)).
* **소스**: 모든 `packages/*/*`와 `apps/*`는 TypeScript. `strict: true` + `noUncheckedIndexedAccess` 필수. `// @ts-nocheck` 금지. `any`는 정당한 이유 없이 쓰지 않음.
* **Configs as code**: `vitest.config.ts`, `tsup.config.ts`, `playwright.config.ts` 등은 TypeScript로 작성하고 `@repo/<tool>-config` preset을 extend. JSON은 JSON만 읽는 도구(Biome, Knip)에만 한정.
* **Scripts**: `tooling/scripts/*`의 비-trivial 스크립트는 TypeScript로 작성, `pnpm tsx ./script.ts`로 실행. Bash는 lifecycle 글루(lefthook hook 본문, CI 오케스트레이션)에만.
* **타입 체크는 빌드 단계 없음**: `tsc --noEmit`이 타입 정확성의 SoT. `turbo run typecheck`로 위임. tsup 번들링은 *별개* 관심사 ([ADR-0004](./docs/adr/0004-typescript-and-compilation-strategy.md)).
* **`paths` 금지, project references 금지**: 패키지 간 resolution은 pnpm + 각 패키지의 `exports` 필드로만 — 런타임 resolution과 동일 (ADR-0004).

### 0.1 라이브러리 버전이 진실의 출처(SoT)

> **기능 구현은 *설치된 라이브러리 버전의 API*에 맞춰 한다. ADR 예시에 맞추지 말 것. 작년에 본 스니펫에 의존하지 말 것.**

`pnpm-workspace.yaml`의 catalog가 권위 있는 버전 pin. ADR은 작성 시점의 **의도**(어떤 도구를 왜 골랐는지)를 기록한다. 메이저 버전이 올라가 public API가 바뀌면:

1. catalog 버전을 올린다.
2. 해당 API를 쓰는 코드를 새 API에 맞춘다.
3. ADR 예시도 새 API를 반영하도록 갱신한다.
4. 이전에 박힌 결정이 업그레이드로 뒤집혔다면 해당 ADR에 짧은 노트를 추가한다.

실제 사례:

* Biome `1.x → 2.x`에서 `--apply`가 `--write`로 변경됨. lefthook 훅은 `--write`여야 함. ADR 예시가 `--apply`로 남아있다면 그건 문서 버그(고칠 것), 코드 버그가 아님.
* tsup `7.x → 8.x`에서 `Options` 타이핑이 바뀌어 preset signature가 달라짐. *설치된* 버전의 `defineConfig` signature가 정답.
* Vitest `4.x`에서 legacy CommonJS reporter loading이 제거됨. `3.x`용으로 쓰인 preset이 catalog가 `4.x`면, preset이 바뀌어야 함.

**Rule of thumb**: 설치된 버전 기준으로 `pnpm install`/`tsc --noEmit`/테스트 스위트가 그린이면 코드는 옳다. 동작하는 코드와 모순되는 ADR 스니펫이 있다면 고쳐야 할 건 ADR.

이 원칙은 이 레포에서 작업하는 **AI 에이전트에게 특히 중요**: Biome / Vitest / tsup / knip / dependency-cruiser / turborepo처럼 빠르게 움직이는 도구는 *기억된 API 모양을 신뢰하지 말 것*. 비-trivial config를 작성하기 전에 항상 설치 버전에서 재유도(`pnpm exec <tool> --help`, 패키지의 `dist/index.d.ts`, 한 줄 probe 등)할 것.

### 0.2 기여자 초기 셋업

1. Node 24 LTS (`.nvmrc` 기준으로 `nvm use` 또는 `fnm use`). `engines.node`가 `>=24.0.0 <25`로 잠겨있음 ([ADR-0002](./docs/adr/0002-monorepo-foundations.md)).
2. `corepack enable` → `packageManager` 필드 기준으로 pnpm 자동 활성화.
3. `pnpm install`.
4. (선택, IDE) VS Code: Biome 익스텐션, TypeScript "Use Workspace Version" 활성화.

전역 TypeScript 설치 불필요 — `typescript`가 catalog 통해 workspace devDep로 들어와 있음.

## 시스템 구조 → docs/reference

폴더 레이아웃 · 패키지 카테고리 · 의존성 레이어/불변규칙 · 어댑터 패턴 · 런타임 토폴로지는
**[`docs/reference/architecture.md`](./docs/reference/architecture.md)** 가 정본이다.
의존성 도입 근거는 [`docs/reference/stack.md`](./docs/reference/stack.md), 결정 기록은 [`docs/adr/`](./docs/adr/).
