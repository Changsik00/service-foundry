# spec-x-ci-tooling-cleanup: tooling 위생 묶음 (knip 힌트 정리 + k8s 드리프트 테스트 CI 편입)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-ci-tooling-cleanup` |
| **Branch** | `spec-x-ci-tooling-cleanup` |
| **상태** | Planning |
| **타입** | chore |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

같은 테마(CI/tooling 위생)의 소품 2건을 한 spec 으로 묶는다.

### A. knip configuration hints 40개

`packages/config/knip-config/base.json` 의 `packages/backend/*` 와일드카드 entry 가
`["src/**/*.test.ts", "roundtrip.ts", "emit-span.ts"]` 인데, `roundtrip.ts` 는
`cache`·`queue` 에만, `emit-span.ts` 는 `observability` 에만 존재한다. 나머지 ~22개
백엔드 패키지에서 "Refine entry pattern (no matches)" 힌트가 **40개** 발생 → 노이즈.

### B. k8s 드리프트 테스트가 CI 미수집

`tooling/k8s/__tests__/manifest-drift.test.ts`(spec-22-01) 와 다른 tooling 테스트
(`tooling/scripts/manifest/lib/validate.test.ts`, `tooling/scripts/config-graph/lib/to-mermaid.test.ts`)
는 tooling 이 워크스페이스 패키지가 아니라 `turbo run test` 가 수집하지 않는다 → CI 미실행.

## 요구사항

1. **knip**: 와일드카드에서 `roundtrip.ts`·`emit-span.ts` 제거 + 실제 보유 패키지에만 per-package entry 추가 → 힌트 0.
2. **k8s/tooling 테스트 CI**: `verify.yml` 에 `npx vitest run tooling` 스텝 추가 → tooling 테스트 3종 CI 실행.
3. 회귀 없음: knip 정리 후에도 cache/queue/observability 의 roundtrip/emit-span 이 entry 로 인식돼 false unused 없음.

## Out of Scope

- tooling 을 정식 워크스페이스 패키지로 승격 (더 큰 구조 변경, 후속 후보).

## 핵심 전략

| 항목 | 전략 |
|:---:|:---|
| **knip** | 와일드카드 entry = `["src/**/*.test.ts"]` 로 축소 + `cache`/`queue`(+roundtrip.ts), `observability`(+emit-span.ts) per-package entry |
| **tooling 테스트** | verify.yml 에 `npx vitest run tooling` (DB 불필요 → install 직후 배치) |

## Proposed Changes

#### [MODIFY] `packages/config/knip-config/base.json`
- `packages/backend/*`: `entry` 에서 `roundtrip.ts`·`emit-span.ts` 제거.
- `packages/backend/cache`·`packages/backend/queue`: `entry: ["src/**/*.test.ts", "roundtrip.ts"]` 추가.
- `packages/backend/observability`: `entry: ["src/**/*.test.ts", "emit-span.ts"]` 추가.

#### [MODIFY] `.github/workflows/verify.yml`
- Install 직후 `npx vitest run tooling` 스텝 추가 (tooling 테스트 CI 편입).

## 검증 계획

```bash
pnpm turbo run knip          # Configuration hints 0 확인
npx vitest run tooling       # tooling 테스트 3종 통과
```

수동 검증 시나리오:
1. `turbo run knip` → "Configuration hints (40)" 사라짐, unused 신규 발생 없음
2. `vitest run tooling` → manifest-drift + validate + to-mermaid 통과
3. PR CI: verify 에서 tooling 테스트 스텝 그린

## ✅ Definition of Done

- [ ] knip 힌트 0 (회귀 unused 없음)
- [ ] verify.yml tooling 테스트 스텝 추가 + 통과
- [ ] PR verify CI 그린
- [ ] `spec-x-ci-tooling-cleanup` 브랜치 push + PR
