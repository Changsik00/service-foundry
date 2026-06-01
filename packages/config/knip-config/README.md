# @repo/knip-config

> 미사용 export·의존 탐지를 위한 공유 Knip 설정 프리셋.

## 설치 / import

Knip 6 은 config `extends` 키를 지원하지 않으므로(`ERROR: Invalid input (unrecognized_keys: extends)`),
루트 `knip.config.ts` 에서 프리셋 JSON 을 import 해 re-export 한다. 프리셋이 SoT.

```ts
// 루트 knip.config.ts
import type { KnipConfig } from "knip";
import base from "@repo/knip-config/base" with { type: "json" };

export default base as KnipConfig;
```

## 핵심 export

- `@repo/knip-config/base` (`base.json`) — 워크스페이스별 entry 패턴, tooling `ignoreDependencies`, `rules` 기본 설정

## 게이트 정책 (spec-15-01)

- **error 급**: `files` / `dependencies` / `unlisted` / `unresolved` / `exports` / `types` — CI red.
- **off**: `duplicates` — 프리셋 패키지의 의도적 named+default dual-export 관례.
- **warn (비차단)**: `catalog` — 보일러플레이트가 제공하는 미사용 catalog 핀(예: `@nestjs/config`)은 의도적 제공이라 visible-only.
- **`ignoreDependencies` (tooling)**: `@repo/biome-config`(루트 단일 biome.json 이 소비)·`@turbo/gen`·`tsup`·`drizzle-kit`·`tailwindcss`·`@nestjs/core`·`@nestjs/testing` 등 중앙화 프리셋/도구는 knip 이 구조적으로 추적 불가 → false positive 회피.
- **워크스페이스별 `ignoreDependencies` (scaffolding)**: 선언만 되고 아직 미배선인 의도적 deps. 예) `apps/api` 의 `@repo/backend-auth-rate-limit` 는 spec-15-02~04 배선 예정. YAGNI-면제 철학상 삭제하지 않고 보존.
- **의도적 미사용 export/type**: 소스에 `/** @public ... */` JSDoc 태그로 표시 (예: `InjectOAuthAccountStore`, `AuditLogInsert`). 코드 삭제 없이 보존하면서 export 게이트는 error 로 유지.

## 자세히

- 레퍼런스: [`docs/explainers/platform/config-packages-presets.md`](../../../docs/explainers/platform/config-packages-presets.md)
