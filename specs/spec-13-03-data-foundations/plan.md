# Implementation Plan: spec-13-03

## 📋 Branch Strategy
- 신규 브랜치: `spec-13-03-data-foundations`
- 시작 지점: `phase-13-api-data` (base branch 모드)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **번들 구성 확정**: A(storage) + B(typedFetch) + C(factory) 를 1 PR 로. outbox 는 13-04 분리.
> - [ ] **typed client = 타입 추출(경량)**: codegen 아님. 덕타이핑 parser 로 zod 의존 없이 검증.

> [!WARNING]
> - [ ] S3 어댑터 · 마이그레이션 러너는 **이번 범위 외**(후속). 성공 기준 6 은 factory 로 부분 충족.

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **A storage** | 포트 + in-memory 어댑터만 (S3 후속) | 새 dep 없이 성공 기준 4 충족, 교체식 |
| **B typedFetch** | 덕타이핑 `{parse}` 래퍼 | zod 직접 의존 없이 contracts 스키마 재사용, codegen 회피 |
| **C factory** | shared `createFactory` (시퀀스 클로저) | 양측 공용, 라이브 DB 불필요하게 단위 검증 가능 |

### 📑 ADR 후보
- [x] 없음 (ADR-0015 적용)

## 📂 Proposed Changes

### A. `@repo/backend-storage` (NEW, `packages/backend/storage/`)
#### [NEW] `src/index.ts`
- `interface Storage { put(key, data, opts?); get(key); del(key); exists(key); url(key); }`
- `type StorageData = Uint8Array | string`, `PutOptions { contentType?: string }`
- `createMemoryStorage(opts?: { baseUrl?: string }): Storage` — `Map<string,{data,contentType}>`.
- `get` 미존재 → `null`. `url` → `${baseUrl}/${key}` (기본 `memory://`).
#### [NEW] `src/index.test.ts`
- put→get round-trip, del 후 get null, exists true/false, url 형식.

### B. typedFetch (`packages/frontend/http-client/`)
#### [MODIFY] `src/index.ts` (또는 신규 `src/typed.ts` + 재노출)
- `async function typedFetch<T>(parser: { parse(v: unknown): T }, input: string, init?): Promise<T>`
- `globalThis.fetch` 사용 → `res.json()` → `parser.parse()` 반환. parse 실패 시 throw 전파.
- 기존 export 비파괴.
#### [MODIFY] `src/index.test.ts`
- `globalThis.fetch` 모킹: 정상 → parsed 객체, parser throw 전파, init(headers/method) 전달 검증.

### C. `@repo/factory` (NEW, `packages/shared/factory/`)
#### [NEW] `src/index.ts`
- `createFactory<T>(builder: (seq: number) => T)` → `{ build(overrides?), buildList(n, overrides?), reset() }`
- 내부 시퀀스 1 부터 증가, `build` 마다 +1. `overrides` 얕은 병합.
#### [NEW] `src/index.test.ts`
- 시퀀스 증가, overrides 적용, buildList(n) 길이/시퀀스, reset.

> 각 신규 패키지: `package.json`(type module, exports, vitest/typecheck 스크립트) + `tsconfig.json`(backend 는 `types:["node"]`). pnpm-workspace catalog 정합.

## 🧪 검증 계획
### 단위 테스트
```bash
pnpm --filter @repo/backend-storage test
pnpm --filter @repo/frontend-http-client test
pnpm --filter @repo/factory test
pnpm -r typecheck   # 또는 각 패키지 tsc --noEmit
```
### 수동 검증
1. `createMemoryStorage()` put→get 동일 바이트 — OK.
2. typedFetch 에 zod 스키마 전달 → 잘못된 응답 throw.

## 🔁 Rollback Plan
- 신규 패키지 3 개 디렉토리 삭제 + http-client typedFetch export 되돌림. 기존 코드 의존 없음 → 영향 0.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md ship
