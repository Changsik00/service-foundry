docs(spec-x-docs-code-drift): 문서↔코드 정합성 drift 정정

## 📋 Summary

### 배경 및 목적
직전 `spec-x-docs-ssot` 로 문서 SSOT 를 정리한 직후, 정본 문서가 실제 코드와 일치하는지 코드레벨 감사(read-only 4분할)를 수행했다. **코드는 문서대로 잘 이행돼 있었고(auth/RLS/스택 0 불일치)**, 오히려 **문서가 코드를 못 따라간 drift** 가 다수 발견되어 코드 현실에 맞춰 동기화한다. (코드는 SoT — CONVENTIONS §0.1, 코드 변경 없음.)

### 주요 변경 사항
- [x] 카탈로그 undercount 정정 — 실존하나 누락됐던 패키지 4개 등재 + 카운트(backend 22→23·nestjs 6→8·frontend 7→8): `@repo/backend-authz`, `@repo/nestjs-auth-firebase`, `@repo/nestjs-auth-supabase`, `@repo/frontend-auth-store`
- [x] 누락 패키지 reference note 4개 신규 작성 (CONVENTIONS §9.1)
- [x] `turborepo-rules.md` 실제 설정 동기화 — Node 22→24, `check-types`→`typecheck`, 루트 `tsconfig.json` 의도적 일탈 명시(+`tsconfig.base.json` 미사용), biome 루트태스크 현실(`//#knip`·`//#depcruise`)
- [x] stale `apps/admin` 예시 제거 (ADR-0025 로 미존재) + `docs/review/*` 2건 카탈로그 등재
- [x] (레포 외) 로컬 cruft `packages/backend/tmp-gencheck` 정리

### 컨텍스트
- **Mode**: SDD-x (Phase 비소속, docs 타입, base `main`)
- **역할**: 정본 문서를 코드 실체와 일치시켜 SSOT 신뢰도 회복

## 🎯 Key Review Points

1. **누락 패키지가 실존인지**: 4개 모두 tracked + src/test 보유 확인 후 문서에 추가 (코드 정리 아님).
2. **루트 tsconfig 일탈 판단**: turbo 권장과 다르게 루트 `tsconfig.json` 유지 — NestJS 데코레이터 필요, paths-free 는 유지되어 권장의 실익 보존. 문서에 일탈로 명시.
3. **turborepo-rules §3.5 처리**: 예시 블록을 통째 재작성하지 않고 "정본=실제 turbo.json + 차이점" 콜아웃으로 정정.

## 🧪 Verification

문서 전용 spec — grep/ls/count 검증:
```bash
ls packages/backend|wc -l   # 23 ↔ index "backend (core, 23)"
ls packages/nestjs|wc -l    # 8  ↔ index "nestjs (adapter, 8)"
ls packages/frontend|wc -l  # 8  ↔ index "frontend (8)"
ls docs/reference/packages/{backend-authz,nestjs-auth-firebase,nestjs-auth-supabase,frontend-auth-store}.md
grep -rn "apps/admin" docs/reference docs/turborepo-rules.md   # stale 0
```
**결과 요약**:
- ✅ 카운트 일치 (23/8/8)
- ✅ reference note 4/4 존재 + index 링크 연결 (고립 노트 0)
- ✅ stale `apps/admin` 0, `check-types` 잔여 0

## 📦 Files Changed

### 🆕 New Files
- `docs/reference/packages/backend-authz.md`
- `docs/reference/packages/nestjs-auth-firebase.md`
- `docs/reference/packages/nestjs-auth-supabase.md`
- `docs/reference/packages/frontend-auth-store.md`

### 🛠 Modified Files
- `docs/index.md`: 카운트 정정 + 누락 4개 + review/ 등재
- `docs/reference/architecture.md`: §6/mermaid 에 authz·firebase/supabase 반영
- `docs/turborepo-rules.md`: Node24·typecheck·tsconfig·biome drift 정정
- `docs/reference/packages/config-typescript-config.md`: stale apps/admin 제거
- `docs/log.md`: 변경 로그 항목

## ✅ Definition of Done

- [x] 검증 명령 통과 (counts/notes/stale)
- [x] `walkthrough.md` / `pr_description.md` ship commit
- [x] `spec-x-docs-code-drift` 브랜치 push
- [x] 코드 변경 없음 (auth/RLS/스택 0 불일치 확인)

## 🔗 관련 자료

- ADR-0023 (auth authority modes), ADR-0025 (frontend consolidation), CONVENTIONS §0.1 (코드=SoT)
- 선행: `spec-x-docs-ssot` (PR #162)
