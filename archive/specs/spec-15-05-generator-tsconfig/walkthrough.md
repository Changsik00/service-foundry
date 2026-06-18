# Walkthrough: spec-15-05

> 본 문서는 *작업 기록* 입니다. 결정 과정, 사용자 협의, 검증 결과를 미래의 자신과 리뷰어에게 남깁니다.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| backend 생성물 typecheck 실패 (node 전역 미해결) | A: preset(`base.json`) 에 `types:["node"]` 추가 / B: 생성기 템플릿에서 backend 분기 추가 | **B** | preset 수정은 기존·수동 생성 패키지 전체에 영향(침습적). 템플릿 분기는 생성물에만 적용 → blast radius 0 |
| 생성물 검증 방식 | A: `buildFiles` 직접 호출 단위검증만 / B: 실제 `turbo gen` 생성 후 typecheck | **B 병행** | 단위 테스트로 출력 고정 + 실제 생성물로 module resolution 포함 end-to-end PASS 증명 |

### ADR 승격 가이드
- [ ] ADR 승격 대상 있음
- [x] 없음 (생성기 템플릿 버그 fix — cross-spec 의존/장수명 아님)

## 💬 사용자 협의

- **주제**: 임시 검증 패키지 정리
  - **사용자 의견**: `rm -rf` / `git clean` 자동 실행 권한 거부
  - **합의**: lockfile 은 `git checkout` 으로 원복, untracked 임시 디렉토리는 repo 루트 기준 `git clean -fd` 로 제거 (사용자 승인 후 실행)

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm exec vitest run turbo/generators/lib/templates.test.ts`
- **결과**: ✅ Passed (5 tests)
- **로그 요약**:
```text
Test Files  1 passed (1)
     Tests  5 passed (5)
```
- TDD Red: backend 케이스만 Fail(`expected undefined to deeply equal { types: ['node'] }`), 나머지 4 PASS → Green 후 5/5 PASS.

#### 전체 게이트
- **명령**: `pnpm turbo run lint typecheck test knip depcruise`
- **결과**: ✅ Passed (136/136 tasks; knip 은 비차단 configuration hint 만 출력)

### 2. 수동 검증

1. **Action**: `pnpm exec turbo gen package --args backend tmp-gencheck`
   - **Result**: 5개 파일 생성. `tsconfig.json` 에 `compilerOptions.types: ["node"]` 포함 확인.
2. **Action**: `src/index.ts` 에 `console.log(process.pid)` 추가 → `pnpm install` → `pnpm --filter @repo/backend-tmp-gencheck typecheck`
   - **Result**: ✅ PASS (exit=0).
3. **Action (대조군)**: tsconfig 에서 `types:["node"]` 제거 후 `tsc --noEmit`
   - **Result**: ❌ exit=2 — `TS2584 Cannot find name 'console'`, `TS2591 Cannot find name 'process'`. fix 가 정확히 이 문제를 해결함을 증명.
4. **Action**: 임시 디렉토리 삭제(`git clean -fd packages/backend/tmp-gencheck`) + lockfile 원복(`git checkout -- pnpm-lock.yaml`) + `pnpm install` 재동기화
   - **Result**: 워킹트리에 잔재 없음, lockfile diff 없음.

## 🔍 발견 사항

- `turbo gen` 은 `--args <category> <name>` 로 비대화 실행 가능 — 향후 생성기 스모크 테스트 자동화에 활용 가능.
- 임시 패키지 생성 → install 후, 디렉토리만 지우면 pnpm node_modules 에 stale importer 가 남아 `turbo run` 이 `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` 로 실패 → `pnpm install` 재동기화 필요.

## 🚧 이월 항목

- 없음.

## 🔗 관련 문서 (Related)

- 관련 wiki: `docs/review/2026-06-01-wiring-audit.md` §E
- 관련 spec: spec-15-01 task-08 (이관 출처)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-01 ~ 2026-06-01 |
| **최종 commit** | `c861e57` |
