# Walkthrough: spec-x-docs-refresh

> 결정 과정, 사용자 협의, 검증 결과를 미래의 자신과 리뷰어에게 남깁니다.
> 작업을 진행하는 동안 *지속적으로* 갱신하세요.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 신규 패키지 reference 범위 | `backend-tenant`/`backend-schema`/`nestjs-tenant`만 vs `backend-id` 포함 4개 | 4개 모두 추가 | 실행 중 `packages/backend` 실측(26개)과 `docs/index.md` 목록(23개) 재대조 결과 `backend-id`도 누락 확인 — spec.md 요구사항 4의 "누락된 패키지" 취지에 그대로 부합해 범위 확장(재정렬 불필요한 동종 항목) |
| 각 패키지 상세 reference 페이지 신규 작성 여부 | 지금 작성 vs Icebox 유지 | Icebox 유지, 인덱스 1줄만 추가 | spec.md Out of Scope에 명시. 상세 페이지는 소스 코드 deep-dive가 필요해 별도 spec-x 스코프 |

## 💬 사용자 협의

- **주제**: e2e CI 실패(Supabase 프로젝트 pause) 발견 후 대응
  - **합의**: `describe.skip` + Icebox 기록으로 처리 (본 spec 이전 세션에서 이미 완료, 별도 커밋)
- **주제**: 문서 최신화 + 아카이브 + 기타 정리 3건을 하나의 PR로 처리
  - **합의**: spec-x(Docs 타입)로 진행, README/docs/index.md/아카이브 3개 태스크로 분리 커밋

## 🧪 검증 결과

### 자동화 테스트
- 문서/하우스키핑 전용 spec — 코드 테스트 대상 없음 (§9.1 문서 전용 예외 적용)
- **명령**: `bash .harness-kit/bin/sdd status`
- **결과**: ✅ Passed — archive 관련 진단 문구("specs/ N개 디렉토리", "완료 phase backlog 잔존") 소거 확인
```text
🔍 진단
  ℹ archive/ 에 150개 spec 보관 중
```

### 수동 검증
1. **Action**: `grep -n "앱 [0-9]개" README.md`
   - **Result**: "앱 3개" 로 일관 — 기존 "앱 4개"/"앱 3개" 내부 모순 해소
2. **Action**: `ls packages/backend | wc -l` / `ls packages/nestjs | wc -l` vs README 표기
   - **Result**: 26 / 9 로 일치
3. **Action**: `grep -c "backend-tenant\|backend-schema\|backend-id\|nestjs-tenant" docs/index.md`
   - **Result**: 4 (전부 존재)

## 🔍 발견 사항

- README "핵심 역량" 절이 phase-17~26(멀티테넌시·RBAC·데이터 UX·어드민+빌링·k8s·public_id)를 전혀 반영하지 못하고 있었음 — 단순 오탈자 수준이 아니라 6개 phase 분량의 콘텐츠 공백이었음.
- `docs/index.md` 패키지 reference 누락이 Icebox 기록(3개)보다 1개 더 많았음(`backend-id` 추가 확인).
- 로컬에 `apps/web-vite/`(untracked, routeTree.gen.ts + .turbo 캐시만 존재)가 남아있음 — git 추적 대상 아니라 PR에 영향 없음, 로컬 정리 대상으로만 별도 언급.

## 🚧 이월 항목 (Optional)

- `backend-tenant`/`backend-schema`/`backend-id`/`nestjs-tenant` 상세 reference 페이지(`docs/reference/packages/*.md`) 신규 작성 → `backlog/queue.md` Icebox 기존 항목 유지
- `docs/explainers/platform/ci-verify-gate.md` web-vite 잔재 설명 갱신 → Icebox 기존 항목 유지
- `turbo/generators/config.ts` vite 옵션 정리(코드 drift) → Icebox 기존 항목 유지
- `/hk-wiki-ingest` — 이번 아카이브로 새로 archive된 spec들의 walkthrough를 wiki 레이어에 반영 (archive 명령이 안내한 후속 단계, 이번 spec 스코프 밖)
