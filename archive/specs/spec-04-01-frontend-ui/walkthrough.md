# Walkthrough: spec-04-01 frontend-ui

> phase-04 첫 spec. `@repo/tailwind-config` (shared preset, tailwind v4 `@theme`) + `@repo/frontend-ui` (shadcn registry, 6 components) 2 패키지 신설. Icebox 이슈 *tailwind 위치* 해소. #19 Phase 4 후보 (`sonner` + `react-hook-form`) 본 spec 안 채택.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| tailwind 위치 (Icebox) | A 공유 preset / B ui 전용 / C 이중 설치 | **A 공유 preset** | monorepo 표준 — 일관 테마 + 앱별 customization |
| tailwind 버전 | v3 / v4 | **v4** | CSS-first (`@theme`) — 장기 자산, shadcn v4 호환 |
| shadcn 패턴 | shared registry / per-app | **shared registry** (`@repo/frontend-ui`) | monorepo 가치 핵심 — 한 곳 components 다수 app 사용 |
| `#19` Phase 4 후보 채택 | sonner / RHF / 둘 다 / 기각 | **둘 다** | spec-04-01 안 박음 — Form (RHF) + Toaster (sonner) 표준 |
| 컴포넌트 build | tsc / no-build (src 노출) | **no-build** | workspace dep `src/*` 직접 노출 — Next/Vite 가 transpile |
| `'use client'` | 모든 component / 일부 | **모든 component** | Next.js App Router Server Component 안 자연 import |
| Radix primitives 위치 | per-component / 전체 모음 | **per-component** | shadcn `add` 답습 — Label/Slot 등 필요시만 박음 |
| CSS variables | 인라인 / globals.css | **globals.css** (`@theme`) | shadcn 표준 — light/dark mode 토글 자연 |
| test env | jsdom + @testing-library/react v16 | 채택 | React 19 호환 (v16+만 React 19 지원) |
| testing-library cleanup | globals true / `afterEach(cleanup)` 명시 | **명시 cleanup** | `globals: false` 모드 — 자동 cleanup 안 박힘 (각 test 격리) |
| TSX transform | esbuild only / `@vitejs/plugin-react` | **plugin-react** | esbuild 만으로 .tsx 처리되나 production-like JSX runtime 위해 plugin 박음 |
| biome CSS lint | 켜기 / 끄기 | **`*.css` exclude** | tailwind v4 directive (`@import "tailwindcss"`, `@theme`) 가 biome unknown at-rule → 거부. CSS 는 framework 처리 — biome 가치 적음 |
| FormField context | per-FormField / shared | **per-FormField (FormFieldContext)** | shadcn 표준 — name 추적 |
| commit 단위 | task별 1 / 묶음 | **task별 1** | revert 단위 명확 |

### ADR 승격 가이드

- [x] **없음** — 본 spec 의 결정은 *기술 trend 답습* (tailwind v4 / shadcn). 후속 spec-04-NN 답습 후 phase-04 ship 또는 phase-05 진입 시점 ADR 격상 후보.

## 💬 사용자 협의

| 시점 | 사용자 결정 |
|---|---|
| 다음 phase 진입 (phase-04 Frontend Foundation) | A 옵션 — Frontend 진입 |
| phase-04 mode | Phase Base Branch 모드 |
| 첫 spec 진입 (ui 먼저 / sdk 먼저 / 병행) | A — ui 먼저 (phase.md 순서) |
| 이슈 처리 정책 | "지금 phase 와 같은 맥락이 있다면 처리, 아니면 대기" — #19 의 Phase 4 후보만 본 spec 안 |
| tailwind 위치 | A 공유 preset |
| tailwind 버전 | v4 |
| shadcn 패턴 | shared registry |
| #19 Phase 4 후보 | sonner + react-hook-form 둘 다 |
| Plan Accept | 즉시 |

## 🔁 진행 과정

### T1 — 브랜치 생성 (commit 없음)

- `git checkout -b spec-04-01-frontend-ui` (시작: `phase-04-frontend-foundation`)

### T2 — catalog 갱신 (`581fc69`)

- tailwind v4 (`@tailwindcss/postcss`, `@tailwindcss/vite`) + React 19 + CVA + clsx + tailwind-merge + Radix label/slot + RHF + sonner + jsdom + testing-library 16+
- spec-04-01 문서 (spec/plan/task) + backlog auto-update 동봉

### T3 — `@repo/tailwind-config` 신설 (`9144c3b`)

- `packages/config/tailwind-config/{package.json, tsconfig.json, src/globals.css, src/preset.ts}`
- tailwind v4 `@theme` directive + shadcn 표준 CSS variables (light + dark mode)
- `.dark` / `[data-theme="dark"]` 셀렉터로 dark mode 토글 자연 지원

### T4 — `@repo/vitest-config/react` — *no-op*

- 기존 react preset (jsdom + tsx include) 이미 박혀있음 — 추가 작업 불필요
- testing-library setup 은 각 패키지가 자체 `vitest.setup.ts` 박음 (`globals: false` 모드 답습)

### T5 — `@repo/frontend-ui` scaffold (`5a04c51`)

- `packages/frontend/ui/{package.json, tsconfig.json, vitest.config.ts, vitest.setup.ts, components.json}` 박음
- `src/lib/utils.ts` — `cn` util (clsx + tailwind-merge)
- `src/styles.css` — `@import "@repo/tailwind-config/globals.css"`
- `src/index.ts` — barrel export stub (cn 만)
- `tsconfig.json` 초기 `moduleResolution: "Bundler"` 시도 → base의 `module: NodeNext` 와 충돌. base 만 extend (Bundler 옵션 제거) 로 해결

### T6 — Button TDD (`7c104f7` Red → `9612a5b` Green)

**Red (`7c104f7`)**:
- `button.test.tsx` 5 test (render / variant / size / asChild / className)
- stub `Button` forwardRef + cva variant/size 시그니처만 (throw "not implemented")
- 초기 TSX transform fail — `@vitejs/plugin-react` 미박힘 → catalog 추가 + vitest.config 박음
- toBeInTheDocument types 누락 → tsconfig `types` 에 `@testing-library/jest-dom` 추가
- typecheck PASS + test 5 Red

**Green (`9612a5b`)**:
- `button.tsx` 본체 (shadcn variants — default/destructive/outline/secondary/ghost/link + sm/lg/icon)
- Slot wrap (asChild prop)
- index barrel export
- test 5/5 ✓

### T7 — Input + Label + Card (`b85579a`)

- 3 components 박음 (단순 wrap — render test 별도 없음, Button 패턴 충분)
- Input: forwardRef + InputHTMLAttributes
- Label: `@radix-ui/react-label` primitive wrap + labelVariants (CVA)
- Card: 6 sub-component (Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter) 모두 forwardRef
- index barrel 갱신

### T8 — Form TDD (`d0a13e9` Red → `8cba54f` Green)

**Red (`d0a13e9`)**:
- `form.test.tsx` 2 test (valid email submit / invalid email submit FormMessage 표시)
- SampleForm component — `useForm({ resolver: zodResolver(schema) })`
- stub Form/FormField/FormItem/FormLabel/FormControl/FormDescription/FormMessage — RHF `ControllerProps` / `UseFormReturn` 타입 답습 + throw
- 초기 typecheck error (`{ field }` implicit any) → stub 시그니처 보강
- typecheck PASS + Form 2 Red

**Green (`8cba54f`)**:
- `form.tsx` 본체 — FormProvider re-export + Controller wrap + FormFieldContext + FormItemContext + useFormField hook (internal)
- shadcn 표준 — htmlFor / aria-describedby / aria-invalid 자동
- FormMessage — error.message 자동 표시 (없으면 null)
- 초기 test fail — testing-library auto cleanup 안 박힘 (globals: false) → vitest.setup.ts 에 `afterEach(cleanup)` 박음
- test 7/7 ✓ (Button 5 + Form 2)

### T9 — Toaster + cn util test (`eeca637`)

- `toaster.tsx` — sonner `Toaster` wrap (default richColors / closeButton / top-right) + `toast` re-export
- `toaster.test.tsx` — render + `toast("...")` 호출 → DOM 메시지 표시 (1 test)
- `lib/utils.test.ts` — `cn` 병합 / falsy 무시 / tailwind 중복 해소 / array+object 인자 (4 test)
- index barrel 갱신
- test 12/12 ✓

### T10 — 통합 검증 (`566b9da` biome css exclude)

- `pnpm lint` 초기 fail — `@repo/tailwind-config:lint` 의 globals.css 가 biome unknown at-rule (`@import "tailwindcss"`, `@theme`) 거부
- **해결**: `packages/config/biome-config/base.json` 의 `files.includes` 에 `"!**/*.css"` 추가 — CSS 는 framework 처리 자연
- 재실행:
  - `pnpm lint` ✓ 17 tasks PASS
  - `pnpm typecheck` ✓ 17 tasks FULL TURBO
  - `pnpm test` ✓ 165 test PASS (frontend-ui 12 신규 + 기존 153)
  - `pnpm exec depcruise` ✔ 0 violations (103 modules / 175 deps)
- `sdd test passed` 호출 — ship gate 통과

### T11 — Ship (본 commit)

- walkthrough + pr_description 작성
- ship commit + push + PR 생성

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | 상태 |
|---|:---:|:---:|
| `@repo/frontend-ui` (신규) | 12 | ✓ |
| 기타 14 패키지 (변경 없음) | 153 | ✓ |
| **합계** | **165** | **all green** |

test 분포 (`@repo/frontend-ui`):
- `button.test.tsx`: 5 (render / variant / size / asChild / className)
- `form.test.tsx`: 2 (valid submit / invalid submit FormMessage)
- `toaster.test.tsx`: 1 (render + toast() 호출)
- `lib/utils.test.ts`: 4 (cn 병합 / falsy / tailwind merge / array+object)

### depcruise

```
✔ no dependency violations found (103 modules, 175 dependencies cruised)
```

이전 (PR #23 직후) 76 modules / 126 deps → +27 module / +49 dep (tailwind-config + frontend-ui).

### 수동 검증

| 항목 | 명령 | 결과 |
|---|---|---|
| `@repo/tailwind-config` 신설 | `ls packages/config/tailwind-config/src/` | globals.css + preset.ts ✓ |
| `@repo/frontend-ui` 신설 | `ls packages/frontend/ui/src/components/` | 6 component .tsx + 3 test ✓ |
| index.ts barrel | `grep "^export" packages/frontend/ui/src/index.ts` | 10+ export (cn + Button + Card 6 + Input + Label + Form 7 + Toaster + toast) |
| components.json shadcn 호환 | `cat packages/frontend/ui/components.json` | shadcn add CLI 호환 (aliases + tailwind) |

## 🔍 발견 사항

1. **biome 2.4 의 CSS parser ↔ tailwind v4 directive 충돌**: `@import "tailwindcss"`, `@theme` 가 unknown at-rule. **해결**: `files.includes` 에 `"!**/*.css"` 추가. CSS 는 framework 처리 자연 — biome lint 가치 적음. 후속 css 파일 자동 적용.

2. **`tsconfig.json` `module: NodeNext` ↔ `moduleResolution: Bundler` 충돌**: 초기 frontend-ui tsconfig 에 `Bundler` 박았는데 base 의 `NodeNext` 와 충돌 (TS5095 / TS5109). **해결**: `moduleResolution` 빼고 base 그대로 사용. workspace dep `src/*` 직접 노출 패턴이라 `NodeNext` 로 충분.

3. **`@vitejs/plugin-react` 필수**: vitest 의 esbuild 만으로 .tsx 처리되나 *React 19 production-like JSX runtime* 위해 plugin 박음. setup 자연. catalog 박아 후속 react 패키지에도 사용.

4. **testing-library v16 만 React 19 호환**: v15 이하 React 18 limit. 모든 future react package 가 v16 박음.

5. **`globals: false` + testing-library cleanup**: vitest 의 `globals: false` 모드는 *auto cleanup 안 박힘* — 각 test 가 *DOM 잔재*. **해결**: `vitest.setup.ts` 에 `afterEach(cleanup)` 명시. 후속 react 패키지에 동일 패턴.

6. **tailwind v4 `@theme` 패러다임 vs v3 `tailwind.config.ts`**: CSS-first — JS preset 의 의미 줄어듦. `preset.ts` 거의 empty. dev 의 *학습 가치* — 초기 학습 곡선 있으나 *장기 자산*.

7. **shadcn `components.json` `tailwind.config` 빈 string**: v4 는 *config 파일 선택적* (`@theme` 으로 처리). shadcn CLI 가 *config 미박힘* 도 호환. 후속 검증 필요 — `shadcn add` 실 사용 시 확인.

8. **`peerDependencies`: react 19 / zod 4**: 명시 — 호출자 (web-next / web-vite) 가 *catalog 의 같은 버전* 박아야 정상 동작. peer drift 위험 박혀있어 — pnpm peer warning 모니터링 필요.

## 🚧 이월 항목

- **dark mode 토글 UI**: `globals.css` 에 `.dark` 셀렉터 박혀있음 — 토글 component (theme provider / switch) 는 spec-04-03 (web-next) 또는 별 spec
- **Form 추가 fields**: DatePicker / Select / Combobox / Checkbox / Radio / Textarea — spec-04-NN 또는 app spec 안에서 박음
- **`shadcn add` 실 사용 검증**: components.json 의 `tailwind.config` 빈 string + v4 호환 — 실 add 시점에 확인
- **storybook / chromatic**: 별 검토
- **animation library** (framer-motion / motion): 별 spec
- **a11y deep dive**: 별 spec
- **frontend-no-react depcruise 룰 검토**: 현 룰은 *frontend/* 가 *react import* 허용. 향후 *backend/* 가 react import 금지 확인 필요 (이미 ADR-0015 박혀있음 — 변경 불필요 가능성 ↑)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-20 |
| **commits** | 10 (T2 catalog + T3 tailwind-config + T5 ui-scaffold + T6 Button Red/Green + T7 Input/Label/Card + T8 Form Red/Green + T9 Toaster + T10 biome) + T11 ship (본 commit) |
| **test 수** | 12 신규 (`@repo/frontend-ui`) — 전체 165 PASS |
| **depcruise** | 0 violations (103 modules / 175 deps, +27 module / +49 dep) |
| **신규 패키지** | `@repo/tailwind-config` + `@repo/frontend-ui` 2개 |
| **#19 처리** | Phase 4 후보 2 항목 채택 (`sonner` + `react-hook-form`) |
| **Icebox 해소** | tailwind 위치 결정 (공유 preset 채택) |
