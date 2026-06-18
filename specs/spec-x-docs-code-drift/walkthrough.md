# Walkthrough: spec-x-docs-code-drift

> 직전 `spec-x-docs-ssot` 정리 직후, 정본 문서가 실제 코드와 일치하는지 코드레벨 감사를 수행하고 발견된 drift 를 정정한 기록.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 누락 패키지 4개 처리 | (A) 문서에 추가 (B) 코드 정리 | A — 문서에 추가 | 4개 모두 실존·tracked·테스트 보유. 코드가 SoT (CONVENTIONS §0.1) |
| 루트 `tsconfig.json` 존재 vs turbo "회피" 권장 | (A) 일탈 명시 (B) 파일 제거 | A — 의도적 일탈 노트 | NestJS 데코레이터에 필요, 코드 동작 정답. resolution 은 여전히 paths-free |
| `turborepo-rules.md §3.5` 예시 drift | (A) 통째 재작성 (B) 콜아웃+사실값 정정 | B | 정본은 실제 `turbo.json`. 문서는 turbo-docs 요약이므로 차이만 명시 |
| cruft `tmp-gencheck` | 로컬 rm | git 미추적(node_modules만) → 레포 무관, 로컬 정리만 |

## 💬 사용자 협의

- **주제**: 감사 결과 처리 범위
  - **합의**: option 1 — doc drift 전부 한 spec-x 로 수정(reference note 4개 신규 포함), tmp-gencheck 즉시 로컬 정리.

## 🧪 검증 결과

### 자동화 검증 (문서 전용 — grep/ls/count)
- **명령**: 패키지 카운트 ↔ index.md 대조, stale 토큰 grep, note 존재 확인
- **결과**: ✅ Passed
```text
backend: 23 ↔ index "backend (core, 23)"  ✓
nestjs:  8  ↔ index "nestjs (adapter, 8)"  ✓
frontend:8  ↔ index "frontend (8)"          ✓
reference note 4/4 존재                      ✓
stale apps/admin (reference+turborepo-rules) 0  ✓
turborepo-rules check-types 잔여 0 → typecheck 통일 ✓
```

### 수동 검증
1. **Action**: 감사 4분할 (패키지 인벤토리 / 툴체인 / auth·RLS·스택 / 문서 내부정합)
   - **Result**: 코드 0 불일치(auth/RLS/스택 완전 일치), 문서 drift 다수 → 문서만 정정

## 🔍 발견 사항

- **코드는 문서대로 잘 이행됨**: AUTH_MODE 3모드·RLS app_runtime/슈퍼유저 가드/ALS org 전파·cross-org e2e·스택 버전 전부 문서와 일치 (0 불일치).
- **문서가 코드를 못 따라간 drift**가 주된 문제: 카탈로그가 실존 패키지 4개를 누락(아이러니하게 직전 SSOT 정리에서 놓침), turborepo-rules 가 계획 시점 값(Node 22·check-types 등)에 멈춰 있었음.
- `frontend/auth-http` 는 README-only 의도된 stub 으로 index 표기 정확 — 유지.

## 🚧 이월 항목

- 없음.
