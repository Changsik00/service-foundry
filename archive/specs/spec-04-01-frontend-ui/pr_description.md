# feat(spec-04-01): `@repo/tailwind-config` + `@repo/frontend-ui` (shadcn registry)

> Phase 4 (Frontend Foundation) **첫 spec**. 2 패키지 신설 — `@repo/tailwind-config` (shared preset, tailwind v4 `@theme`) + `@repo/frontend-ui` (shadcn registry: Button / Input / Label / Card / Form (RHF) / Toaster (sonner) + `cn` util). Icebox *tailwind 위치* 해소. #19 Phase 4 후보 2 항목 (`sonner` + `react-hook-form`) 본 spec 안 채택.

## 📋 Summary

### 배경 및 목적

phase-04 진입 — `apps/` 디렉토리에 *frontend app 없음*, `packages/frontend/*` 도 *미존재*. Frontend foundation 박는 시점. monorepo 의 *UI 일관성* + tailwind v4 (장기 자산) + shadcn registry 패턴 박음. 후속 spec (sdk / web-next / web-vite) 가 *본 패키지 import*.

### 주요 변경 사항

- [x] **`@repo/tailwind-config`** (`packages/config/tailwind-config/`):
  - tailwind v4 (`@theme` directive)
  - shadcn 표준 CSS variables (light + dark mode)
  - `.dark` / `[data-theme="dark"]` 셀렉터로 dark mode 토글
  - 호출자: `@import "@repo/tailwind-config/globals.css"`

- [x] **`@repo/frontend-ui`** (`packages/frontend/ui/`):
  - shadcn-style 6 components (모두 `'use client'`, forwardRef):
    - `Button` (CVA + Slot, 6 variant × 4 size, asChild)
    - `Input` / `Label` (Radix) / `Card` (6 sub-component composable)
    - `Form` + react-hook-form 통합 (Form/FormField/FormItem/FormLabel/FormControl/FormDescription/FormMessage + useFormField hook)
    - `Toaster` (sonner wrap, default richColors / closeButton / top-right) + `toast` re-export
  - `cn` util (clsx + tailwind-merge)
  - `components.json` (shadcn CLI 호환 — registry path, aliases, neutral baseColor)
  - `src/styles.css` — `@import "@repo/tailwind-config/globals.css"`

- [x] **catalog 갱신** (`pnpm-workspace.yaml`):
  - frontend runtime: `react ^19.2.6` / `react-dom` / `tailwindcss ^4.3.0` + `@tailwindcss/{postcss, vite}` (양쪽 plugin) / CVA / clsx / tailwind-merge
  - Radix: `@radix-ui/react-{label, slot}`
  - Form: `react-hook-form` / `@hookform/resolvers`
  - Toaster: `sonner`
  - types: `@types/{react, react-dom}` (^19.2)
  - test toolchain: `jsdom` / `@testing-library/{react v16, jest-dom}` / `@vitejs/plugin-react`

- [x] **biome config**: `*.css` exclude (tailwind v4 directive 거부 해소)

- [x] **단위 테스트 12 신규**: Button 5 + Form 2 + Toaster 1 + cn util 4

### Phase 컨텍스트

- **Phase**: `phase-04` Frontend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-04-frontend-foundation`
- **본 SPEC 역할**: phase-04 *기반 박는 시점* — 후속 sdk/web-next/web-vite 가 본 패키지 import

## 🎯 Key Review Points

1. **🎯 Icebox 해소 — tailwind 위치 *공유 preset***: `@repo/tailwind-config` 신설. monorepo 표준 — 일관 테마 + 앱별 customization 자유. ui 전용 (B) / 이중 설치 (C) 모두 기각.

2. **tailwind v4 채택 — CSS-first 패러다임**: `@theme` directive 박음. `tailwind.config.ts` JS 파일 *대부분 미사용*. 학습 곡선 있으나 *장기 자산*. shadcn v4 호환.

3. **shadcn shared registry — `@repo/frontend-ui` 가 components 보유**: per-app shadcn add 기각. monorepo 가치 핵심 — 한 곳 components, 다수 app `import`. `components.json` shadcn CLI 호환.

4. **#19 Phase 4 후보 2 항목 채택**: 사용자 *"phase 와 같은 맥락만 처리"* 정책 따름 — `sonner` (Toaster) + `react-hook-form` (Form) 본 spec 안. Phase 5+ 후보 (`ts-pattern`) 등은 미채택.

5. **`Form` shadcn 표준 패턴**: FormProvider + Controller wrap + FormFieldContext + FormItemContext + `useFormField` hook. htmlFor / aria-describedby / aria-invalid 자동. `FormMessage` error.message 자동 표시 — RHF + zodResolver 통합 검증 (E2E test 2개).

6. **TDD Red/Green + stub 시그니처 보강**: `Form` 의 RHF `ControllerProps` / `UseFormReturn` 타입 stub 시점에 박음 — typecheck 통과 + test runtime Red 유지. 후속 react 패키지 답습 패턴.

7. **`globals: false` testing-library cleanup 명시**: vitest 의 globals: false 모드는 testing-library auto cleanup 안 박힘 → `vitest.setup.ts` 에 `afterEach(cleanup)` 명시. 후속 react 패키지 동일 패턴.

8. **biome `*.css` exclude — tailwind v4 directive 거부 해소**: biome 2.4 css parser 가 `@import "tailwindcss"`, `@theme` 를 unknown at-rule 거부. `files.includes` 에 `"!**/*.css"` 추가 — CSS 는 framework 처리 자연.

9. **`@vitejs/plugin-react`** + **`@testing-library/react v16`**: 둘 다 React 19 production-like 처리 필수. catalog 박혀 후속 react 패키지에 즉시 사용.

10. **depcruise 0 violations** (103 modules / 175 deps, +27 / +49): ADR-0015 룰 통과. `packages/frontend/*` → `packages/backend/*` import 0건.

11. **commit 10개 (excl ship) — TDD Red/Green 분리**: catalog → tailwind-config → ui-scaffold → Button Red/Green → Input/Label/Card → Form Red/Green → Toaster → biome → ship. revert 단위 명확.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
```

**결과**:
- ✅ `pnpm lint`: 17 tasks PASS (biome `*.css` exclude 적용 후)
- ✅ `pnpm typecheck`: 17 tasks FULL TURBO
- ✅ `pnpm test`: **165 test PASS** (frontend-ui 12 신규 + 기존 153)
- ✅ `depcruise`: **0 violations** (103 modules / 175 dependencies)

### test 분포 (12 신규 — `@repo/frontend-ui`)

| describe | test 수 | 검증 |
|---|:---:|---|
| `Button` | 5 | render / variant / size / asChild / className |
| `Form` (RHF + zodResolver) | 2 | valid email submit / invalid email submit (FormMessage 표시) |
| `Toaster` (sonner) | 1 | render + `toast()` 호출 → DOM 메시지 |
| `cn` util | 4 | 병합 / falsy 무시 / tailwind 중복 해소 / array+object 인자 |

### 수동 검증

```bash
# 1. 신규 패키지 2개
ls packages/config/tailwind-config/src/  # globals.css + preset.ts
ls packages/frontend/ui/src/components/   # 6 .tsx + 3 .test.tsx

# 2. index.ts barrel export
grep "^export" packages/frontend/ui/src/index.ts | wc -l
# → 10+ (cn + Button + Card 6 + Input + Label + Form 7 + Toaster + toast)

# 3. shadcn components.json
cat packages/frontend/ui/components.json
# → aliases + tailwind config 박힘

# 4. tailwind-config globals.css
head -20 packages/config/tailwind-config/src/globals.css
# → @import "tailwindcss"; + @theme {...}
```

## 🔗 참조

- **ADR**: [`docs/adr/0003-package-layout-and-naming.md`](../docs/adr/0003-package-layout-and-naming.md), [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md)
- **walkthrough**: `specs/spec-04-01-frontend-ui/walkthrough.md` (결정 13 + 협의 9 + 진행 11 + 검증 + 발견 8 + 이월 7)
- **이슈 처리**: #19 Phase 4 후보 *sonner* + *react-hook-form* 채택 (체크박스 갱신 — phase-04 ship 시점 일괄 close 검토)
- **후속 spec**: spec-04-02 frontend-sdk → spec-04-03 web-next → spec-04-04 web-vite

## 📝 Post-Merge

- [ ] Merge → `phase-04-frontend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-04.md` / `backlog/queue.md` (spec-04-01 → Merged)
- [ ] 사용자 알림 + spec-04-02 (frontend-sdk) 진입 옵션

## ✅ Definition of Done

- [x] `@repo/tailwind-config` 신설 (globals.css + preset)
- [x] `@repo/frontend-ui` 신설 (6 components + cn util + components.json)
- [x] tailwind 위치 결정 (Icebox 해소) — 공유 preset
- [x] tailwind v4 (`@theme`) 박음
- [x] `react-hook-form` + `sonner` 채택 (#19 Phase 4 후보)
- [x] 단위 테스트 12 PASS
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] `pnpm exec depcruise` 0 violations
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-04-frontend-foundation`)
- [ ] 사용자 알림
