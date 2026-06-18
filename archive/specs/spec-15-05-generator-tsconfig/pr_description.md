fix(spec-15-05): generate backend tsconfig with types:["node"]

## 📋 Summary

### 배경 및 목적
`turbo gen`(`pnpm new`) 패키지 생성기는 backend 카테고리에 `compilerOptions` 없이 `@repo/typescript-config/base` 만 extends 하는 tsconfig 를 만든다. `base.json` 에는 `types:["node"]` 가 없어, 생성된 backend 패키지가 `console`/`process` 등 Node 전역을 쓰면 즉시 typecheck 가 깨졌다(DX 저하, phase-15 성공기준5 미충족).

### 주요 변경 사항
- [x] `tsconfig()` 템플릿: backend 카테고리 → `compilerOptions.types: ["node"]` 생성
- [x] 템플릿 단위 테스트 신규 (카테고리별 tsconfig 출력 회귀 고정)
- [x] shared/frontend/nestjs/config 동작 불변 — preset 으로 이미 충족

### Phase 컨텍스트
- **Phase**: `phase-15` (security-wiring)
- **본 SPEC 의 역할**: 성공기준5("`pnpm new`(backend) 가 `types:["node"]` 포함 tsconfig 생성, console/process 사용해도 typecheck PASS") 충족. phase 마지막 spec.

## 🎯 Key Review Points

1. **fix 위치 = 생성기 템플릿 (preset 비침습)**: `base.json` 을 건드리지 않아 기존·수동 생성 패키지 영향 0. backend 분기만 추가.
2. **nestjs/frontend 미변경**: nestjs preset = node, react preset = DOM 으로 이미 충족이라 분기 불필요.

## 🧪 Verification

### 자동 테스트
```bash
pnpm exec vitest run turbo/generators/lib/templates.test.ts
pnpm turbo run lint typecheck test knip depcruise
```

**결과 요약**:
- ✅ `tsconfig 템플릿`: 5/5 통과 (backend → types:[node], shared → lib, frontend → tsx, nestjs → preset, config → 미생성)
- ✅ 전체 게이트: 136/136 tasks

### 수동 검증 시나리오
1. **생성물 PASS**: `turbo gen package --args backend tmp-gencheck` → `console.log(process.pid)` 추가 → `typecheck` exit=0
2. **대조군**: `types:["node"]` 제거 시 `TS2584/TS2591` (console/process 미해결) exit=2 → fix 가 원인 해결 증명

## 📦 Files Changed

### 🆕 New Files
- `turbo/generators/lib/templates.test.ts`: 카테고리별 tsconfig 출력 회귀 테스트

### 🛠 Modified Files
- `turbo/generators/lib/templates.ts` (+7, -1): `tsconfig()` 에 backend → `{ types: ["node"] }` 분기 추가

**Total**: 2 files changed (+52, -1)

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-15.md`
- Walkthrough: `specs/spec-15-05-generator-tsconfig/walkthrough.md`
