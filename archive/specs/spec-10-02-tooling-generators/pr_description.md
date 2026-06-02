# feat(spec-10-02): 패키지 코드 생성기 (turbo gen)

## 📋 Summary

### 배경 및 목적

새 패키지를 추가하려면 기존 패키지를 손으로 복사·수정해야 했고, 카테고리(shared/backend/frontend/nestjs/config)마다 디렉토리·`@repo/*` 네이밍·tsconfig extends·deps 규칙(ADR-0003/0015)이 달라 실수가 쉬웠다. 본 spec 은 **turbo gen** 기반 `pnpm new package` 로 이를 자동화한다.

### 주요 변경 사항
- [x] `pnpm new package` (= `turbo gen package`) — 카테고리 5종 prompt 후 ADR-0003/0015 규칙대로 스캐폴딩
- [x] `resolvePackageTarget` 순수 함수로 카테고리→{dir, @repo name, tsconfig extends, vitest preset} 매핑 (단위 테스트 8케이스)
- [x] 생성 직후 `biome check --write` 로 lint-clean 보장
- [x] `turbo/generators/smoke-test.sh` — 생성→install→lint/typecheck/test→정리 통합 테스트
- [x] 신규 외부 의존 0 (`@turbo/gen` 은 turbo-family)

### Phase 컨텍스트
- **Phase**: `phase-10` (Ops & Tooling)
- **본 SPEC 의 역할**: 성공 기준 2번(`pnpm new package` scaffold) 충족 + 시나리오 2(generator round-trip) 통과

## 🎯 Key Review Points

1. **`turbo/generators/lib/resolve-target.ts`**: 카테고리 규칙의 단일 진실(SoT). ADR-0003/0015 매핑이 정확한지 — 단위 테스트로 고정.
2. **생성 후 biome 포맷**: `config.ts` 가 생성 직후 `biome check --write` 실행 → JSON.stringify 배열 줄바꿈 등을 정규화해 0 error 보장.
3. **범위 경계**: `pnpm new app` 은 미포함(후속 spec). config 카테고리는 JSON 프리셋만(src/test 없음).
4. **환경 블로커 처리**: turbo gen ↔ lefthook prepare 충돌(harness#161) — `core.hooksPath` unset 으로 우회. 상세는 walkthrough.

## 🧪 Verification

### 단위 테스트
```bash
pnpm exec vitest run turbo/generators/lib/resolve-target.test.ts
```
**결과**: ✅ 8 passed (5 카테고리 + 오류 입력 + config 중복 suffix)

### 통합 테스트
```bash
bash turbo/generators/smoke-test.sh
```
**결과**: ✅ 생성→install→lint/typecheck/test 0 error → 정리

### 수동 검증
1. `pnpm exec turbo gen package --args shared gendemo` → 5 파일 생성 → lint/typecheck/test 0 error

## 📦 Files Changed

### 🆕 New Files
- `turbo/generators/config.ts`: turbo gen `package` 생성기 (prompt + write + biome 포맷)
- `turbo/generators/lib/resolve-target.ts`: 카테고리→타깃 매핑 (순수)
- `turbo/generators/lib/resolve-target.test.ts`: 매핑 단위 테스트 (8)
- `turbo/generators/lib/templates.ts`: 파일 콘텐츠 빌더 (순수)
- `turbo/generators/smoke-test.sh`: 통합 스모크 테스트

### 🛠 Modified Files
- `package.json` (+2): `"new": "turbo gen"` + `@turbo/gen` devDep
- `pnpm-workspace.yaml` (+1): `@turbo/gen` catalog
- `pnpm-lock.yaml`: `@turbo/gen` 설치 반영

**Total**: 8 files changed (+786)

## ✅ Definition of Done

- [x] 단위 테스트 PASS (8)
- [x] 통합 테스트(smoke) PASS
- [x] `walkthrough.md` / `pr_description.md` ship commit
- [x] lint / typecheck 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-10.md`
- Walkthrough: `specs/spec-10-02-tooling-generators/walkthrough.md`
- 관련 이슈: harness-kit#161
- 후속: `pnpm new app` 생성기 (별도 spec)
