# Implementation Plan: spec-15-05

## 📋 Branch Strategy
- 신규 브랜치: `spec-15-05-generator-tsconfig`
- 시작 지점: `phase-15-security-wiring` (phase base)
- PR base = `phase-15-security-wiring`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **fix 위치 = 생성기 템플릿** (preset 아님). backend 생성 tsconfig 에 `types:["node"]` 추가. preset(`base.json`) 을 건드리지 않아 기존 패키지·수동 생성 영향 0.
> - [ ] **검증 = 템플릿 단위 + 임시 패키지 생성 typecheck**. 생성기 테스트는 `turbo run test`(CI) 미포함이라 단위 테스트는 로컬 `vitest run` 으로 확인. 추가로 임시 backend 패키지 실제 생성→console typecheck PASS 후 정리(커밋 안 함).

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| fix 위치 | `templates.ts` `tsconfig()` | 생성기 SoT, preset 비침습 |
| backend compilerOptions | `{ types: ["node"] }` | base.json 에 node types 없음 → backend 는 Node 코드 |
| nestjs/frontend | 변경 없음 | preset(nestjs=node, react=DOM)으로 충족 |
| 검증 | 템플릿 단위 + 임시 생성 typecheck | 출력 고정 + 실제 생성물 PASS 증명 |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

#### [MODIFY] `turbo/generators/lib/templates.ts`
- `tsconfig()`: `compilerOptions` 분기에 backend → `{ types: ["node"] }` 추가.
```text
const compilerOptions =
  category === "shared"  ? { lib: ["ES2023", "DOM"] } :
  category === "backend" ? { types: ["node"] } :
  undefined;
```

#### [NEW] `turbo/generators/lib/templates.test.ts`
- `tsconfig(target, category)` 출력 검증: backend → types:[node], shared → lib, frontend → tsx include, nestjs/config 동작.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트
```bash
pnpm exec vitest run turbo/generators/lib/templates.test.ts   # 카테고리별 tsconfig
pnpm exec vitest run turbo/generators/lib/resolve-target.test.ts   # 회귀(불변)
```
### 수동(생성물) 검증
```bash
pnpm new   # backend 카테고리, 임시 이름(예: tmp-gencheck)
# 생성된 src 에 console.log(process.pid) 추가 → pnpm --filter @repo/backend-tmp-gencheck typecheck PASS
# 확인 후 생성 디렉토리 삭제 + 워크스페이스 원복 (커밋 안 함)
```
### 게이트
```bash
pnpm turbo run lint typecheck knip depcruise
```

## 🔁 Rollback Plan
- 템플릿 1줄 분기 추가 → revert 안전. 기존 생성물·preset 무영향.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
