# spec-20-01: 아바타 업로드

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-20-01` |
| **Phase** | `phase-20` |
| **Branch** | `spec-20-01-avatar-upload` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-13 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

phase-19에서 계정 관리 API(비밀번호·이름·탈퇴)와 계정 설정 UI가 구현됐다. `packages/backend/storage`에 `Storage` 포트 인터페이스와 `MemoryStorage` in-memory 어댑터가 있으나, 실제 Supabase Storage 어댑터는 아직 없다. `users` 테이블에 `avatar_url` 컬럼이 없고, `GET /auth/me` 응답에도 아바타 URL이 없다.

### 문제점

사용자가 프로필 이미지를 설정할 수 없다. 계정 설정 UI(`/account` > 프로필 탭)에 아바타 영역이 없다.

### 해결 방안 (요약)

Supabase Storage 어댑터를 `apps/api` 인프라 레이어에 최소 구현하고, `POST /auth/account/avatar` 엔드포인트로 파일을 받아 저장 후 `users.avatar_url`을 갱신한다. `GET /auth/me`가 `avatarUrl`을 포함하도록 `ProviderMeController`를 DB 조회 방식으로 전환한다. 프론트엔드 `ProfileForm`에 아바타 미리보기 + 파일 업로드 UI를 추가한다.

## ⚠️ 선행 조건

`phase-19-account-authz` 브랜치가 **main에 머지된 후** 구현을 시작해야 한다.

의존 항목:
- `apps/api/src/auth/account.controller.ts` (`AccountController`)
- `apps/api/src/auth/account.service.ts` (`AccountService`)
- `apps/api/src/auth/account.stores.ts` (`AccountUserStore`, `ACCOUNT_USER_STORE`)
- `apps/api/src/infra/schema/users.ts` (`displayName`, `deletedAt` 컬럼)
- 마이그레이션 `0016_*` ~ `0018_*` (phase-19 마이그레이션)

## 🎯 요구사항

### Functional Requirements

1. `POST /auth/account/avatar` — multipart/form-data `avatar` 필드 (JPEG/PNG/WebP, 최대 2 MB) 수신 → Supabase Storage `avatars` 버킷에 저장 → `users.avatar_url` 갱신 → `{ status: "ok", avatarUrl: string }` 반환
2. `GET /auth/me` — `avatarUrl: string | null` 필드 포함
3. 콘솔 UI `/account` > 프로필 탭 — 현재 아바타 이미지 표시 (없으면 이니셜 플레이스홀더) + 파일 인풋으로 새 아바타 업로드

### Non-Functional Requirements

1. 파일 크기 초과(>2 MB) → 400 + 명확한 오류 메시지
2. 허용되지 않은 MIME 타입 → 400
3. 업로드 중 버튼 비활성화 (`isPending`)
4. 아바타 URL은 Supabase Storage public URL (`{SUPABASE_URL}/storage/v1/object/public/avatars/{userId}`)

## 🚫 Out of Scope

- 이미지 리사이즈·압축 (클라이언트 원본 업로드)
- 아바타 삭제 API (별도 스펙)
- CDN 연동
- 조직 아바타 (개인 계정만)

## 🔗 관련 문서

- `packages/backend/storage/src/index.ts` — `Storage` 포트 인터페이스
- `apps/api/src/auth/account.controller.ts` — 기존 account 컨트롤러 (phase-19)
- `apps/api/src/auth/account.stores.ts` — `AccountUserStore` 인터페이스 (phase-19)
- `apps/web/src/features/account/ProfileForm.tsx` — 프론트 프로필 폼 (spec-19-07)

## ✅ Definition of Done

- [ ] `supabase-storage.ts` 단위 테스트 PASS (mock Supabase client)
- [ ] `POST /auth/account/avatar` e2e PASS (파일 업로드 → me 응답 avatarUrl 반영)
- [ ] `GET /auth/me` avatarUrl 필드 포함 확인
- [ ] 프론트엔드 ProfileForm 아바타 UI 브라우저 수동 검증
- [ ] `walkthrough.md` + `pr_description.md` 작성
- [ ] `spec-20-01-avatar-upload` 브랜치 push + PR 생성
