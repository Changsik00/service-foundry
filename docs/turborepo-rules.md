# service-foundry를 위한 Turborepo 규칙

공식 Turborepo 문서(v2)에서 정제했다. 인용은 인라인이며, 모든 규칙에는 출처 페이지로 가는 `[docs]` 링크가 붙는다. 문서에서 다루지 않는 섹션은 채워 넣지 않고 `N/A`로 표시한다.

---

## 1. 워크스페이스 구조

### 1.1 필수 최상위 레이아웃 ([docs](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository))

모든 모노레포는 반드시 다음을 갖춰야 한다:

1. `"private": true`가 설정된 루트 `package.json`
2. 패키지 매니저 lockfile (`pnpm-lock.yaml`)
3. 루트 `turbo.json`
4. 모든 패키지 디렉터리에 `package.json`
5. `pnpm-workspace.yaml`의 워크스페이스 선언

### 1.2 apps/ vs packages/

문서는 두 폴더로 나눈다:

- `apps/` — 실행 가능한 애플리케이션/서비스 (Next.js, Vite, Fastify, BullMQ worker)
- `packages/` — 라이브러리와 툴링

원칙(요약): "Never include shared code in Application Packages; use separate Internal Packages instead." 앱은 의존성 그래프의 리프여야 한다.

### 1.3 네이밍과 스코프

- 네임스페이스 접두사를 사용한다: *"It's best practice to use a namespace prefix for your Internal Packages to avoid conflicts with other packages on the npm registry."* ([docs](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository))
- 우리는 합의한 대로 `@repo/*`를 사용한다.
- `name` 필드가 import 식별자다 — `@repo/math`가 consumer가 import하는 이름이다.

### 1.4 중첩 워크스페이스 glob — 지원되나 규칙 있음

문서는 명시적이다: *"Turborepo does not support nested packages like `apps/**` or `packages/**` due to ambiguous behavior among package managers."* ([docs](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository))

하지만 `packages/*`와 `packages/group/*` 같이 서로 구분되는 여러 glob은 다음 조건 하에 사용 가능하다:

- 중간 "카테고리" 디렉터리에 `package.json`이 없을 것 (예: `packages/backend/package.json`이 있으면 안 됨).
- 패키지가 다른 패키지 안에 중첩되지 않을 것 (`foo`와 `bar` 모두 `package.json`을 가진 `packages/foo/bar` 같은 구조 금지).

우리가 계획한 `pnpm-workspace.yaml`은 괜찮다:

```yaml
packages:
  - apps/*
  - packages/*/*
```

중요한 귀결: `packages/config`, `packages/shared`, `packages/backend`, `packages/frontend`, `packages/testing`은 패키지가 아니다 — 그냥 디렉터리다. 그 안에 `package.json`을 두지 마라.

### 1.5 필수 루트 `package.json` 필드

```json
{
  "name": "service-foundry",
  "private": true,
  "packageManager": "pnpm@11.1.2",
  "engines": { "node": ">=22" }
}
```

- `packageManager`는 turbo 2.0부터 필수다 ([docs](https://turborepo.dev/docs/crafting-your-repository/upgrading)).
- `engines.node`는 이제 글로벌 해시의 일부다 ([docs](https://turborepo.dev/docs/crafting-your-repository/upgrading)): *"The `engines` field in root `package.json` now factors into cache hashing."*

---

## 2. 내부 패키지 컨벤션

### 2.1 필수 `package.json` 필드 ([docs](https://turborepo.dev/docs/crafting-your-repository/creating-an-internal-package))

```json
{
  "name": "@repo/logger",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "check-types": "tsc --noEmit",
    "lint": "biome check .",
    "test": "vitest run"
  }
}
```

문서의 핵심 포인트:

- `name`은 import 식별자다; 워크스페이스 내에서 유일해야 한다.
- ESM을 위해 `type: "module"` (우리의 NodeNext 결정과 일치).
- `main`보다 `exports`를 선호하라. *"Exports field defines multiple entry points using sub-paths and conditions."*
- `private: true`는 기본적으로 npm에 올라가지 않게 한다; publish할 때 패키지별로 토글한다.

### 2.2 `exports` 필드 패턴

TypeScript 조건과 sub-path (문서에서 권장):

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./errors": {
      "types": "./dist/errors.d.ts",
      "default": "./dist/errors.js"
    },
    "./package.json": "./package.json"
  }
}
```

Consumer는 `import { ... } from "@repo/logger/errors"`로 import한다.

### 2.3 Compiled vs Just-in-Time 패키지

문서는 두 전략을 구분한다 ([docs](https://turborepo.dev/docs/guides/tools/typescript)):

| 모드 | 사용 시점 | TS 설정 |
| --- | --- | --- |
| **Just-in-Time** | 내부 전용, publish하지 않음; 번들링되는 앱(Next.js, Vite)이 소비 | `exports`가 `./src/index.ts`를 `"types"` AND `"default"`로 직접 가리킴; 빌드 단계 없음 |
| **Compiled** | publish되는 라이브러리 OR Node 런타임(Fastify api, worker)이 소비 | `exports`가 `./dist`를 가리킴; `tsc` 또는 `tsup`으로 빌드; `declaration: true`, `declarationMap: true` 설정 |

우리 스택에 적용:

- `shared/*`, `frontend/ui`, `frontend/sdk` → Just-in-Time으로 충분 (Next/Vite가 번들링).
- `backend/*` (`node`로 실행되는 `apps/api`, `apps/worker`가 소비) → **Compiled** (tsup) 필수, Node가 `.ts`를 로드하지 못하기 때문.
- `config/*` 패키지는 도구가 소비하는 JSON이나 `.js`/`.ts` 설정일 뿐; 빌드 불필요.

### 2.4 tsconfig: project references vs path mapping

문서는 TS Project References를 명시적으로 비권장한다 ([docs](https://turborepo.dev/docs/guides/tools/typescript)): *"They introduce both another point of configuration as well as another caching layer to your workspace."*

문서는 TS `paths`도 비권장한다: *"We recommend Node.js subpath imports instead via package.json `imports` field. This approach is more robust."*

규칙:

- 루트 `tsconfig.json` 없음. *"Monorepos should avoid root-level `tsconfig.json` files. Each package maintains its own configuration."*
- 각 패키지는 `@repo/typescript-config/base.json`을 extend한다.
- 패키지 간 참조는 pnpm이 `@repo/<pkg>`로 해결한다; 번들러 / `tsc`는 `exports` 맵을 통해 해석한다. `paths` 없음.

### 2.5 빌드 도구 (tsc vs tsup vs unbuilt)

문서가 `tsc`에 대해 말하는 것: *"Using `tsc` directly for compilation rather than bundlers, which adds extra complexity to your build process."* ([docs](https://turborepo.dev/docs/guides/tools/typescript))

하지만 publishing 가이드는 라이브러리에 `tsup`을 권장한다 ([docs](https://turborepo.dev/docs/guides/publishing-libraries)):

```json
"build": "tsup src/index.ts --format cjs,esm --dts"
```

우리의 결정:

- `packages/config/*` — 빌드 없음 (도구가 읽는 JSON / TS 설정일 뿐).
- `packages/shared/*`, `packages/frontend/{ui,sdk,auth}` — Just-in-Time, 빌드 없음 (번들링되는 앱이 소비).
- `packages/backend/*` — `tsup` (ESM only, `--dts`, dev에서 watch). 결과물은 `dist/`로.
- 앱들 — 각 프레임워크의 빌드를 사용 (Next/Vite/Fastify-as-Node).

---

## 3. turbo.json 패턴

### 3.1 필드 참조 요약 ([docs](https://turborepo.dev/docs/reference/configuration))

| 필드 | 의미 | 기본값 |
| --- | --- | --- |
| `tasks.<task>.dependsOn` | 먼저 끝나야 하는 태스크 | `[]` |
| `tasks.<task>.outputs` | 성공 시 캐시되는 파일 | `[]` (캐시 안 함) |
| `tasks.<task>.inputs` | 태스크 해시에 들어가는 파일 | 모든 git-tracked |
| `tasks.<task>.env` | 해시에 영향을 주는 env 변수 (와일드카드 `FOO*`, 부정 `!X`) | `[]` |
| `tasks.<task>.passThroughEnv` | 태스크에 노출되는 env 변수 (해시 영향 없음) | `[]` |
| `tasks.<task>.cache` | 결과물을 캐시할지 여부 | `true` |
| `tasks.<task>.persistent` | 장기 실행 태스크; 어떤 것도 `dependsOn`할 수 없음 | `false` |
| `tasks.<task>.interruptible` | `turbo watch`로 재시작 가능 | `false` |
| `tasks.<task>.outputLogs` | `full` \| `hash-only` \| `new-only` \| `errors-only` \| `none` | `full` |
| `tasks.<task>.with` | 함께 실행할 형제 태스크 | `[]` |
| `globalDependencies` | 모든 태스크의 해시에 들어가는 파일 | `[]` |
| `globalEnv` | 모든 태스크의 해시에 들어가는 env 변수 | `[]` |
| `globalPassThroughEnv` | 모든 태스크에 노출되는 env 변수 | `[]` |
| `ui` | `tui` \| `stream` | `stream` |
| `concurrency` | 정수 또는 `"50%"` | `"10"` |
| `cacheDir` | 로컬 캐시 디렉터리 | `.turbo/cache` |
| `envMode` | `strict` \| `loose` | `strict` (2.0부터) |

### 3.2 dependsOn 문법 ([docs](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks))

- `"^build"` — 모든 직접 의존성에서 `build`를 먼저 실행. `^`는 *"tells Turborepo to run the task in direct dependencies before the target package."*
- `"build"` — 같은 패키지에서 `build`를 먼저 실행.
- `"@repo/contracts#build"` — 특정 패키지의 특정 태스크를 실행.
- `[]` — 의존성 없음.

### 3.3 `$TURBO_DEFAULT$` 마이크로문법

git-default 입력을 잃지 않으면서 정제한다:

```json
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "!README.md", "!**/*.test.ts"]
    }
  }
}
```

명시적 입력 리스트를 쓰는 것보다 이것을 선호하라 — git 인식 능력을 유지할 수 있다.

### 3.4 dev를 위한 `persistent` + `cache: false` ([docs](https://turborepo.dev/docs/crafting-your-repository/developing-applications))

모든 dev 태스크는 반드시 둘 다 설정해야 한다:

```json
"dev": { "cache": false, "persistent": true }
```

### 3.5 이 스택을 위한 구체적인 루트 `turbo.json`

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalDependencies": [
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "tsconfig.base.json",
    ".env",
    ".env.*"
  ],
  "globalEnv": ["NODE_ENV", "CI"],
  "globalPassThroughEnv": ["PATH", "HOME", "SHELL", "TERM"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "!**/*.test.ts",
        "!**/*.spec.ts",
        "!**/__tests__/**"
      ],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "build/**"],
      "outputLogs": "new-only"
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "interruptible": true
    },
    "check-types": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "tsconfig.*.json"],
      "outputs": []
    },
    "lint": {
      "inputs": [
        "$TURBO_DEFAULT$",
        "$TURBO_ROOT$/biome.jsonc"
      ],
      "outputs": []
    },
    "lint:fix": {
      "cache": false,
      "inputs": ["$TURBO_DEFAULT$"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "vitest.config.*",
        "$TURBO_ROOT$/packages/config/vitest-config/**"
      ],
      "outputs": ["coverage/**"],
      "env": ["VITEST_*"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true,
      "interruptible": true
    },
    "knip": {
      "inputs": ["$TURBO_DEFAULT$", "knip.json", "knip.config.*"],
      "outputs": []
    },
    "depcruise": {
      "inputs": ["$TURBO_DEFAULT$", ".dependency-cruiser.cjs"],
      "outputs": []
    },
    "//#format-and-lint": {},
    "//#format-and-lint:fix": { "cache": false }
  }
}
```

참고:

- `lint`, `check-types`, `knip`, `depcruise`는 pass/fail만 산출하므로 `outputs: []`로 선언한다; 그래도 *로그*는 캐시되기를 원하며, turbo는 `outputs`와 무관하게 그렇게 한다.
- Biome는 공식 Biome 가이드에 따라 **루트 태스크** (`//#format-and-lint`)로 산다 — §6.1 참조.
- `$TURBO_ROOT$`는 글로브를 워크스페이스 루트 기준으로 만든다, 그래서 공유 biome / vitest 설정을 사용하는 패키지들도 그 파일들이 바뀌면 무효화된다 ([docs](https://turborepo.dev/docs/reference/configuration)).

---

## 4. 태스크 그래프 & 캐싱

### 4.1 캐시 키에 들어가는 것 ([docs](https://turborepo.dev/docs/crafting-your-repository/caching))

두 가지 해시:

1. **글로벌 해시** — 루트 `turbo.json`, 루트 lockfile, `globalDependencies` 파일들, `globalEnv` 값들, 동작에 영향을 주는 CLI 플래그(`--cache-dir`, `--framework-inference`, `--env-mode`), passthrough 인자.
2. **태스크 해시** — 패키지의 `turbo.json`, 패키지 lockfile 변경, 패키지 `package.json`, `inputs`에 매칭되는 파일들.

둘 중 하나라도 바뀌면 ⇒ 캐시 miss.

### 4.2 inputs vs globalDependencies — 배치 규칙

- 한 패키지의 한 태스크에만 영향을 주는 파일이면 `inputs`에 넣어라.
- 진정으로 *모든* 패키지의 *모든* 태스크에 영향을 주는 파일(예: lockfile, 루트 tsconfig base, biome 설정)일 때만 `globalDependencies`에 넣어라.
- `globalDependencies`는 최소로 유지하라 — *"If any file matching these globs changes, all tasks will miss cache."* ([docs](https://turborepo.dev/docs/reference/configuration))

### 4.3 결정성은 전제된다

문서의 경고 ([docs](https://turborepo.dev/docs/crafting-your-repository/caching)): *"Turborepo assumes that your tasks are deterministic. Different outputs from identical inputs break caching reliability."*

함의: 타임스탬프, 무작위 ID, `Date.now()` 같은 것을 빌드 결과물에 굽지 마라.

### 4.4 선택적 실행 / `--filter` ([docs](https://turborepo.dev/docs/reference/run))

우리의 카테고리 레이아웃(`packages/<category>/<pkg>`)에 유용한 필터:

| 목표 | 명령 |
| --- | --- |
| 단일 패키지 | `turbo build --filter=@repo/logger` |
| 모든 backend 패키지 | `turbo build --filter="./packages/backend/*"` |
| 모든 앱 | `turbo build --filter="./apps/*"` |
| `web` + 그 의존성 | `turbo build --filter=web...` |
| `@repo/contracts` + 그것의 dependent들 | `turbo build --filter=...@repo/contracts` |
| main 이후 변경된 것 | `turbo build --filter="[main...HEAD]"` |
| 마지막 커밋에서 변경된 것 | `turbo build --filter="[HEAD^1]"` |
| PR에서 변경된 앱 | `turbo build --filter="./apps/*" --filter="[origin/main...HEAD]"` |
| admin 제외 | `turbo build --filter="./apps/*" --filter="!./apps/admin"` |

여러 `--filter` 플래그는 OR로 합쳐진다. 부정은 `!`를 쓴다.

### 4.5 자동 스코핑

*"When you're in a package's directory, `turbo` will automatically scope commands to the Package Graph for that package."* ([docs](https://turborepo.dev/docs/crafting-your-repository/running-tasks)) — `cd apps/api && turbo dev`는 의도대로 동작한다.

### 4.6 Remote cache (보류)

로컬 캐시는 `.turbo/cache`에 산다. 나중에 remote를 활성화할 때 필요한 것:

- `TURBO_TOKEN` (secret)과 `TURBO_TEAM` (variable) ([docs](https://turborepo.dev/docs/guides/ci-vendors/github-actions))
- 아티팩트 서명을 원한다면 `remoteCache.signature: true` + `TURBO_REMOTE_CACHE_SIGNATURE_KEY`
- 느린 네트워크용으로 `remoteCache.timeout` / `uploadTimeout` 오버라이드 고려
- 향후 플래그 `longerSignatureKey` (32바이트 이상 키 강제) ([docs](https://turborepo.dev/docs/reference/configuration))

스캐폴드 시점에는 remote-cache 작업이 필요 없지만, 나중에 활성화하는 날 Just Work하도록 `globalDependencies`와 `inputs`를 정직하게 유지하라.

---

## 5. 프레임워크 통합

### 5.1 Next.js (`apps/web`, `apps/admin`) ([docs](https://turborepo.dev/docs/guides/frameworks/nextjs))

```jsonc
// apps/web/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": ["NEXT_PUBLIC_*"]
    }
  }
}
```

- `!.next/cache/**`는 필수다 — Next의 내부 캐시는 빌드 결과물의 일부가 아니며 아티팩트를 부풀린다.
- `env: ["NEXT_PUBLIC_*"]` 와일드카드를 써서 모든 public env 변수가 해시에 들어가게 하라.
- Docker용: `next.config.ts`에서 `output: "standalone"`을 활성화하면 `turbo prune`과 잘 동작한다 (§8.2).

### 5.2 Vite ([docs](https://turborepo.dev/docs/guides/frameworks/vite)) — 현재 Vite 앱 없음 (ADR-0025), apps/admin 신설 시 참조

```jsonc
// <vite-app>/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

- Vite의 기본 `outDir`은 `dist`다. 일치시킨다.
- dev에는 특별한 태스크가 필요 없다; 루트 `dev` (cache:false, persistent:true)로 충분하다.

### 5.3 Fastify / Node 앱 (`apps/api`, `apps/worker`)

문서에는 Fastify/Node 전용 가이드가 없다. 일반 Node 앱 패턴을 적용한다:

- `build`는 `tsup` (또는 `tsc`) → `dist/` 실행
- `start`는 `node dist/index.js` 실행
- `dev`는 `tsx watch src/index.ts` (또는 `tsup --watch` + `node --watch`) 실행

```jsonc
// apps/api/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "start": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

### 5.4 라이브러리용 tsup

publishing 가이드에서 ([docs](https://turborepo.dev/docs/guides/publishing-libraries)):

- `dist/**`는 태스크의 `outputs`에 있어야 한다
- `dist/`는 gitignore된다
- Dev 모드: `tsup --watch` (Turbo가 watcher를 중복시키지 않는다)

우리의 ESM-only 백엔드 패키지용:

```jsonc
// packages/backend/logger/package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap",
    "dev":   "tsup src/index.ts --format esm --dts --watch"
  }
}
```

---

## 6. 스택 적응 노트

### 6.1 Biome ([docs](https://turborepo.dev/docs/guides/tools/biome))

문서는 Biome가 충분히 빨라서 쪼개도 얻는 게 적기 때문에 **루트 태스크**로 실행하기를 명시적으로 권장한다:

```jsonc
// turbo.json (위에서 이미 보임)
"//#format-and-lint": {},
"//#format-and-lint:fix": { "cache": false }
```

```jsonc
// root package.json
{
  "scripts": {
    "format-and-lint":     "biome check .",
    "format-and-lint:fix": "biome check . --write"
  }
}
```

문서의 주의사항: *"Root-level Biome configuration causes cache misses when upgrading Biome or modifying its config."* 나중에 더 나은 캐시 hit 비율을 원한다면 패키지별 `lint` 태스크로 쪼개고 `biome.jsonc`를 `globalDependencies`에 넣어라.

우리 셋업에서는 §3.5에 패키지별 `lint` 태스크도 포함해서 개별 패키지를 `--filter`로 lint할 수 있게 한다. 루트의 Biome는 오케스트레이션 엔트리이고, 패키지별은 세분화된 것이다. 실제로는 하나를 골라라 — 권장: **루트 only**로 시작하고 필요하면 나중에 패키지별 추가.

### 6.2 Vitest ([docs](https://turborepo.dev/docs/guides/tools/vitest))

문서는 세 가지 접근을 다룬다. 우리의 선택: **Approach 1 — 공유 설정 패키지를 가진 패키지별 캐시된 `test`**:

```jsonc
// turbo.json (이미 보임)
"test":       { "dependsOn": ["^build"], "outputs": ["coverage/**"], "env": ["VITEST_*"] },
"test:watch": { "cache": false, "persistent": true, "interruptible": true }
```

```jsonc
// package script
"test":       "vitest run",
"test:watch": "vitest --watch"
```

- 공유 설정: `@repo/vitest-config`가 `vitest.base.ts`를 노출하고, 각 패키지의 `vitest.config.ts`가 그것을 import한다.
- 주의사항: 통합 리포트를 원하면 coverage 리포트 병합은 수동이다 — 필요해지면 `nyc merge`를 사용하라.
- 루트에서 Vitest의 `projects` 기능을 사용하지 마라: 문서가 경고한다 *"Any change in any package will result in a cache miss"*. 루트 test 태스크가 모든 것에 대해 해시되기 때문이다.

### 6.3 Knip

공식 Turborepo 가이드 없음. 일반 dead-code 태스크 패턴을 적용한다:

- 패키지별 `knip` 스크립트 배치: `"knip": "knip"`.
- 각 패키지는 자체 `knip.json`을 가지거나 (또는 `@repo/knip-config`를 extend).
- §3.5의 태스크 설정이 `knip.json` + `knip.config.*`를 해시한다.
- `outputs: []` (knip은 stdout에 리포트를 내고 non-zero로 exit할 뿐).

### 6.4 dependency-cruiser

공식 Turborepo 가이드 없음. 패턴:

- `@repo/depcruise-config`에서 공유되는 단일 루트 `.dependency-cruiser.cjs`.
- 루트 스크립트: `"depcruise": "depcruise apps packages --config .dependency-cruiser.cjs"`.
- `turbo.json`에 루트 태스크로 등록: `"//#depcruise": {}`.
- 루트 태스크의 inputs에 `.dependency-cruiser.cjs` 추가 (또는 `$TURBO_DEFAULT$`에 의존).
- boundaries-as-tags의 대안: turbo는 자체의 실험적 `boundaries` 기능도 있지만 ([docs](https://turborepo.dev/docs/reference/boundaries)), 우리는 ADR에 따라 dependency-cruiser로 이미 결정했다.

### 6.5 tsup

§5.4 참조. 주의사항:

- `dist/**`를 `build.outputs`에 추가하라. `outputs` 없이는 *"Hitting cache on subsequent runs will not restore any file outputs."* ([docs](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks))
- `dist/`를 루트 `.gitignore`에 추가하라.
- watch 모드를 위해 tsup의 네이티브 `--watch`를 쓰고 태스크에 `persistent: true, cache: false`를 짝지어라.

### 6.6 lefthook

공식 가이드 없음. Lefthook은 turbo가 아니라 git hook이 호출한다. 권장 패턴:

- pre-commit에서 hook이 `turbo run lint check-types --filter="[HEAD]"`을 호출 (변경분만 스코핑).
- Pre-push: `turbo run test --filter="[origin/main...HEAD]"`.
- Lefthook 자체는 루트의 `lefthook.yml`로 설정되며, `globalDependencies`에 추가하지 않는 한 turbo의 해시에 들어가지 않는다.

### 6.7 changesets ([docs](https://turborepo.dev/docs/guides/publishing-libraries))

- 루트에 설치: `@changesets/cli`.
- 권장 publish 흐름: `"publish-packages": "turbo run build lint test && changeset version && changeset publish"`.
- 버전 bump를 자동 커밋하려면 `.changeset/config.json`에 `"commit": true` 설정.
- `.changeset/**`을 `globalDependencies`에 추가? **아니다** — changeset마다 모든 태스크 캐시가 무효화된다. 빼라.

### 6.8 pnpm catalogs

문서는 catalogs(pnpm 9.5+)를 권장 버전 동기화 메커니즘으로 언급하지만 **Turborepo 측의 특별 처리는 문서화되어 있지 않다**.

추론 가능한 함의:

- Catalog 버전은 `pnpm-workspace.yaml`에 산다. 그 파일은 이미 우리 설정의 `globalDependencies`에 있다 (§3.5), 그래서 catalog 변경은 모든 것을 무효화한다 — 올바른 동작.
- `pnpm-lock.yaml`은 이미 글로벌 레벨에서 해시된다; catalog 버전 bump는 lockfile을 통해서도 드러난다.
- turbo가 catalog를 "보게" 하기 위한 패키지별 설정은 필요 없다.

---

## 7. 생성기 (`turbo gen`) ([docs](https://turborepo.dev/docs/guides/generating-code))

### 7.1 메커니즘

- Plop 기반; 우리 레포에 Plop dep 필요 없음.
- `@turbo/gen`을 루트 devDependency로 설치 (TypeScript 타입용).
- 발견 규칙: turbo가 자동 로드한다:
  - 모노레포 루트의 `./turbo/generators/config.ts`
  - 패키지별 `./<workspace>/turbo/generators/config.ts`
- 생성기는 자기 워크스페이스 루트에서 실행된다.
- 커스텀 생성기 내부의 ESM 의존성은 지원되지 않는다 (CJS만).
- 임시 새 패키지를 위한 빌트인 `turbo gen workspace`와 `turbo gen workspace --copy`가 있다.

### 7.2 우리가 원하는 생성기

| 생성기 | 목적 | 템플릿 위치 |
| --- | --- | --- |
| `new-package` | `packages/<category>/<name>`을 `package.json`(name, exports, scripts), `tsconfig.json`, `src/index.ts`, 선택적 `turbo.json`과 함께 스캐폴드 | `turbo/generators/templates/package/**` |
| `new-app`     | `apps/<name>` 스캐폴드 (프레임워크 파라미터: next \| vite \| fastify \| worker) | `turbo/generators/templates/app/<framework>/**` |
| `new-backend-package` | `new-package`와 동일하지만 tsup, dist outputs, ESM이 사전 wiring됨 | `turbo/generators/templates/backend-package/**` |

생성기 설정 골격:

```ts
// turbo/generators/config.ts
import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("new-package", {
    description: "Create a new internal package under packages/<category>",
    prompts: [
      { type: "list", name: "category", message: "Category", choices: ["config", "shared", "backend", "frontend", "testing"] },
      { type: "input", name: "name", message: "Package name (without @repo/ prefix)" },
    ],
    actions: [
      { type: "addMany", destination: "packages/{{category}}/{{name}}", base: "templates/package", templateFiles: "templates/package/**" }
    ],
  });
}
```

---

## 8. CI 통합 ([docs](https://turborepo.dev/docs/guides/ci-vendors), [docs](https://turborepo.dev/docs/guides/ci-vendors/github-actions))

### 8.1 GitHub Actions 골격

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}     # for later remote cache
      TURBO_TEAM:  ${{ vars.TURBO_TEAM }}         # repo VARIABLE not secret, to avoid log censoring
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }                  # required for [HEAD^1] filter
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec turbo run lint check-types test build --output-logs=new-only
```

PR에서 affected-only 빌드를 하려면 추가: `--filter="[origin/${{ github.base_ref }}...HEAD]"`.

### 8.2 유용한 플래그

- `--summarize` → 캐시 miss 디버깅을 위한 `.turbo/runs/*.json` ([docs](https://turborepo.dev/docs/reference/run))
- `--dry=json` → 실행 없이 미리보기; "무엇이 바뀔까?" 작업에 좋음
- `--output-logs=new-only` → CI에서 캐시된 로그를 재생하지 않음, 로그를 짧게 유지
- `--cache-dir=./.turbo/cache` → `actions/cache@v4`와 키 `${{ runner.os }}-turbo-${{ github.sha }}`를 함께 사용 시
- 러너에 여유 코어가 있으면 `--concurrency=100%`
- 아무것도 바뀌지 않았을 때 셋업 전체를 건너뛰려면 `turbo query affected --packages <name> --exit-code` ([docs](https://turborepo.dev/docs/guides/skipping-tasks))

### 8.3 로컬 전용 캐시 (Vercel 없이) 폴백

```yaml
- uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: ${{ runner.os }}-turbo-
```

### 8.4 Docker / 배포

`turbo prune <app> --docker`를 사용 ([docs](https://turborepo.dev/docs/reference/prune)):

- 출력 디렉터리 `./out`
- `./out/json` — `package.json`들만 (Docker 레이어 1로 `pnpm install`에 사용)
- `./out/full` — 대상 서브그래프의 전체 소스
- 루트의 pruned lockfile

표준 멀티 스테이지 Dockerfile 패턴 (문서 기준):

1. `FROM node AS deps` — `./out/json` + lockfile 복사 → `pnpm install`
2. `FROM node AS builder` — `./out/full` + node_modules 복사 → `pnpm turbo run build --filter=<app>`
3. `FROM node AS runner` — 빌드 결과물 복사 (Next는 `apps/<app>/.next/standalone`, Node는 `dist/`)

---

## 9. 문서가 명시적으로 지적하는 안티패턴

| 안티패턴 | Quote | Source |
| --- | --- | --- |
| 중첩된 워크스페이스 패키지 | "Turborepo does not support nested packages like `apps/**` or `packages/**` due to ambiguous behavior among package managers." | [structuring](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) |
| 루트에 의존성 설치 | "Avoid installing excessive dependencies at the workspace root, as changing the workspace root whenever you add, update, or delete a dependency causes unnecessary cache misses." | [managing-dependencies](https://turborepo.dev/docs/crafting-your-repository/managing-dependencies) |
| 코드에서 `node_modules` 경로 참조 | "The location of the dependency on disk can change with other dependency changes around the Workspace." | [managing-dependencies](https://turborepo.dev/docs/crafting-your-repository/managing-dependencies) |
| 루트 `tsconfig.json` | "Monorepos should avoid root-level `tsconfig.json` files. Each package maintains its own configuration." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| TS Project References | "They introduce both another point of configuration as well as another caching layer to your workspace." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| TS `paths` 매핑 | "We recommend Node.js subpath imports instead via package.json `imports` field. This approach is more robust." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| 내부 전용 TS 라이브러리에 번들러 사용 | "Using `tsc` directly for compilation rather than bundlers, which adds extra complexity to your build process." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| 캐시되는 태스크에 `outputs` 잊기 | "Without this key defined, Turborepo will not cache any files. Hitting cache on subsequent runs will not restore any file outputs." | [configuring-tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) |
| `--parallel` 플래그 | "Ignores the task dependency graph, losing caching and ordering benefits." (deprecated) | [reference/run](https://turborepo.dev/docs/reference/run) |
| 비결정적 태스크 | "Turborepo assumes that your tasks are deterministic. Different outputs from identical inputs break caching reliability." | [caching](https://turborepo.dev/docs/crafting-your-repository/caching) |
| Vitest 루트 `projects` 설정 | "Any change in any package will result in a cache miss." | [tools/vitest](https://turborepo.dev/docs/guides/tools/vitest) |
| `cache: false` 없는 persistent 태스크 | 암묵적: persistent 태스크는 "never exit"하므로 캐시와 결합은 정의되지 않은 동작; 문서는 항상 둘을 짝짓는다. | [developing-applications](https://turborepo.dev/docs/crafting-your-repository/developing-applications) |
| 빌드 outputs에 `.next/cache/**` 포함 | 문서 예시가 능동적으로 제외한다: `["outputs": [".next/**", "!.next/cache/**"]]`. | [configuring-tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) |
| `TURBO_TEAM`을 secret에 두기 | "Use repository variables instead of secrets for `TURBO_TEAM` to keep GitHub Actions from censoring your team name in log output." | [github-actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions) |

---

## 10. 열린 질문

문서가 해결하지 못해 로컬 결정이 필요한 항목들:

1. **Biome 루트 vs 패키지별** — 문서는 루트를 권장; 패키지별이 캐시 측면에서 더 낫다. 기본은 루트로 가되, 실제 비용이 측정되는 순간 (예: Biome만으로 CI > 30 s) 재검토. §6.1 참조.
2. **`@repo/*` 설정 패키지와 turbo 해싱** — 문서는 config-only 패키지(예: `@repo/typescript-config`)가 dependent 태스크에 어떻게 해시되어야 하는지 설명하지 않는다. 우리의 접근: 모든 패키지의 `tsconfig.json`이 설정 패키지에서 extend; tsconfig는 패키지 `inputs`에; consumer는 `@repo/typescript-config`에 의존하므로 그 변경이 `package.json` 해싱을 통해 무효화된다. 빌드 시점에 turbo가 실제로 `base.json` 같은 것이 바뀔 때 재해싱하는지 확인 (dep 안의 git-tracked 파일이므로 그럴 가능성 큼).
3. **Knip 캐싱** — 공식 가이드 없음. `outputs: []`로 표시하는 것이 로그-캐시를 위해 옳지만, knip이 느리다면 `--reporter json > knip-report.json`을 두고 그것을 캐시하고 싶을 수 있다.
4. **dependency-cruiser 루트 태스크 vs 패키지별** — Biome와 같은 트레이드오프. 문서는 다루지 않음. 기본은 루트; depcruise는 어차피 그래프를 통째로 스캔한다.
5. **Vitest coverage 병합** — 문서가 이를 수동 작업으로 명시. coverage가 중요해질 때까지 보류; `nyc merge` 또는 `vitest run --coverage --reporter=json` 집계 재검토.
6. **패키지별 Compiled vs Just-in-Time 결정** — 문서가 둘 다 설명하지만 결정적 규칙은 주지 않음. 우리 규칙(§2.3): Node-consumed = Compiled, 번들러-consumed = JIT. 기계적으로 만들기 위해 생성기 템플릿(§7.2)에 인코딩.
7. **모든 패키지의 `engines` 필드** — 문서는 루트 `engines`가 글로벌 해시된다고 함; 패키지별에 대해서는 침묵. 안전한 기본값: `engines.node`는 루트에서만 핀.
8. **패키지별 `turbo.json` vs 단일 루트** — 문서가 둘 다 허용. 루트 only로 시작; 앱이 프레임워크 고유의 outputs(Next `.next/**`, Vite `dist/**`)를 필요로 할 때만 패키지 레벨 `turbo.json`을 도입 — 예시는 §5에 이미 보임.
9. **`futureFlags.filterUsingTasks`** — 더 세분화된 CI에 유망하지만 여전히 future. 추적하다 안정화되면 채택.
10. **Remote cache 공급자** — 미선택. 옵션: Vercel (zero-config, vendor lock-in), 셀프 호스팅 (예: `ducktors/turborepo-remote-cache`), 없음. 이득을 보기 전(아마 CI가 일관되게 5분 초과할 때)에 결정.
