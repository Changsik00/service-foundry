# phase-20: 데이터 UX

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-20-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-20` |
| **상태** | In Progress |
| **시작일** | 2026-06-13 |
| **목표 종료일** | — |
| **소유자** | changsik |
| **Base Branch** | phase-20-data-ux |

## 🎯 배경 및 목표

### 현재 상황

phase-19 완료로 계정 관리·RBAC·API Key·계정 설정 UI까지 구현됐다. 그러나 사용자/조직 프로필 이미지(아바타)가 없고, 목록형 화면에 검색·필터·페이지네이션이 없어 데이터가 늘수록 UX가 무너진다. CSV 가져오기·내보내기, 삭제 데이터 복구(soft-delete 보존) 등 데이터 조작 수단도 미구현 상태다.

### 목표 (Goal)

사용자가 아바타를 업로드할 수 있고, 멤버·데이터 목록을 검색·필터·페이지네이션으로 탐색할 수 있으며, CSV로 데이터를 내보내거나 가져올 수 있는 상태. soft-delete된 데이터는 복구 가능.

### 성공 기준 (Success Criteria) — 정량 우선

1. 아바타 업로드 API e2e PASS + 콘솔 UI에서 아바타 표시
2. 멤버 목록 검색·필터 API e2e PASS + 프론트 반영
3. 커서 기반 페이지네이션 API e2e PASS + 무한 스크롤 또는 "더 보기" UI 동작
4. CSV export API e2e PASS (멤버 목록 기준)
5. CSV import API e2e PASS (멤버 초대 bulk)
6. soft-delete 복구 API e2e PASS

## 🧩 작업 단위 (SPEC + phase-FF)

> 본 절은 phase 의 *작업 지도* 입니다. phase 설계 시 각 작업을 크기에 맞게 미리 배치합니다 — 실질적/불확실 → **SPEC**(아래 표), 작고 가역적인 1–2 commit → **phase-FF**(맨 아래 목록, spec 산출물 없음, → ADR-004).
> SPEC 은 *요점 + 방향성 + 참조* 까지만 적습니다. 자세한 spec/plan/task 는 `specs/spec-20-{seq}-{slug}/` 에서 작성합니다.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-20-03` | member-search-filter-pagination | P? | Merged | `specs/spec-20-03-member-search-filter-pagination/` |
<!-- sdd:specs:end -->

### spec-20-01 — 아바타 업로드

- **요점**: 프로필 이미지 업로드 API + 콘솔 UI 표시
- **방향성**: `packages/backend/storage` 포트 배선 (현재 stub). `POST /auth/account/avatar` (multipart/form-data) → storage 저장 → `users.avatar_url` 갱신. `GET /auth/me` 응답에 `avatarUrl` 포함. 프론트 `ProfileForm` 에 아바타 미리보기·업로드 UI 추가.
- **참조**:
  - `packages/backend/storage/src/` (storage 포트)
  - `apps/api/src/auth/account.controller.ts` (기존 account 컨트롤러)
- **연관 모듈**: `packages/backend/storage/`, `apps/api/src/auth/`, `apps/web/`

### spec-20-02 — 멤버 목록 검색·필터·페이지네이션

- **요점**: 멤버 목록 API에 검색(이름/이메일)·역할 필터·커서 페이지네이션 추가 + 프론트 반영
- **방향성**: `GET /orgs/:orgId/members?search=&role=&cursor=&limit=` 파라미터 추가. `packages/backend/pagination-contracts` 기존 스키마 활용. 프론트 멤버 목록 페이지에 검색 인풋·역할 필터 드롭다운·"더 보기" 버튼 추가.
- **참조**:
  - `apps/api/src/auth/org-members.service.ts`
  - `apps/web/src/app/(console)/members/`
- **연관 모듈**: `apps/api/src/auth/`, `apps/web/`, `packages/backend/pagination-contracts/`

### spec-20-03 — CSV export/import

- **요점**: 멤버 목록 CSV 내보내기 + bulk 초대 CSV 가져오기
- **방향성**: `GET /orgs/:orgId/members/export` → CSV 스트림 응답. `POST /orgs/:orgId/members/import` (multipart CSV) → 파싱 → 유효성 검사 → bulk 초대. 실패 행은 에러 상세 포함 응답. 프론트 멤버 페이지에 export 버튼·import 모달 추가.
- **참조**:
  - `apps/api/src/auth/org-members.service.ts`
  - `apps/api/src/auth/org-invite.service.ts`
- **연관 모듈**: `apps/api/src/auth/`, `apps/web/`

### spec-20-04 — soft-delete 복구

- **요점**: soft-delete된 사용자 복구 API (admin 전용) + 삭제 사용자 목록 조회
- **방향성**: `GET /orgs/:orgId/members/deleted` (owner 전용) → 삭제된 멤버 목록. `POST /orgs/:orgId/members/:userId/restore` → `deleted_at = null` + email 역마스킹. 복구 시 새 세션 발급 없이 재로그인 안내.
- **참조**:
  - `apps/api/src/auth/account.service.ts` (soft-delete 구현 — spec-19-01)
  - `apps/api/src/auth/org-members.service.ts`
- **연관 모듈**: `apps/api/src/auth/`, `apps/web/`

### phase-FF 예정 항목 (spec 미생성)

| 항목 | 요점 | 예상 commit |
|---|---|:---:|
| phase 진입 chore | phase.md 메타 확정 | 1 |

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 페이지네이션 방식 | 오프셋 / 커서 | 커서 | 멤버 추가·삭제 빈번 — 오프셋은 중복·누락 위험 |
| storage 구현체 | S3 / Supabase Storage / local | Supabase Storage | 기존 Supabase 스택 일관성 + 별도 S3 설정 불필요 |
| CSV import 실패 처리 | 전체 롤백 / 부분 성공 | 부분 성공 + 에러 리포트 | bulk 초대에서 한 행 오류로 전체 실패는 UX 최악 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 아바타 업로드

- **Given**: 인증된 사용자
- **When**: `POST /auth/account/avatar` (이미지 파일)
- **Then**: 200 + `GET /auth/me` 응답에 `avatarUrl` 반영
- **연관 SPEC**: spec-20-01

### 시나리오 2: 멤버 목록 페이지네이션

- **Given**: org에 멤버 15명
- **When**: `GET /orgs/:orgId/members?limit=10` → 첫 페이지 10명 + `nextCursor` 반환
- **Then**: `GET /orgs/:orgId/members?cursor=<nextCursor>&limit=10` → 나머지 5명 반환
- **연관 SPEC**: spec-20-02

### 시나리오 3: CSV bulk 초대

- **Given**: org admin 권한 사용자
- **When**: `POST /orgs/:orgId/members/import` (5행 CSV, 1행 중복 이메일)
- **Then**: 4명 초대 성공, 1명 에러 상세 포함 응답
- **연관 SPEC**: spec-20-03

## 🔗 의존성

- **선행 phase**: phase-19 (계정 관리 API, RBAC 배선)
- **외부 시스템**: Supabase Storage (spec-20-01)
- **연관 ADR**:
  - `docs/adr/0022-multitenancy-foundation.md` (org 스코프)
  - `docs/adr/0024-tenant-isolation-enforcement.md` (RLS)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| storage 포트 배선 복잡도 | 중간 | spec-20-01에서 Supabase Storage adapter 최소 구현 후 포트 추상화 |
| CSV 대용량 파일 메모리 | 중간 | 스트리밍 파서 + 행 단위 처리, 최대 파일 크기 제한 |
| 커서 페이지네이션 일관성 | 낮음 | 커서를 `id` 기반으로 — 정렬 불안정 방지 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC merge (base branch `phase-20-data-ux` → main)
- [ ] 통합 테스트 전 시나리오 PASS
- [ ] 성공 기준 6개 정량 달성
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
