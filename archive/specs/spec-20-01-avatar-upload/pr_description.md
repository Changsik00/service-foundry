# spec-20-01: 아바타 업로드

## 변경 사항

- **DB**: `users.avatar_url TEXT` 컬럼 추가 (마이그레이션 `0019_avatar_url.sql`)
- **Backend**:
  - Supabase Storage 어댑터 (`apps/api/src/infra/storage/supabase-storage.ts`) 구현 — `Storage` 포트 준수
  - `AccountUserStore.updateAvatarUrl` + `findById` avatarUrl 포함
  - `AccountService.updateAvatar(userId, buffer, contentType)` — 크기(2 MB)/MIME 검증
  - `POST /auth/account/avatar` (multipart/form-data, AuthGuard) — 업로드 후 `{ status: "ok", avatarUrl }`
  - `GET /auth/me` — `ProviderMeController`가 DB 조회로 `displayName` + `avatarUrl` 반환
  - `STORAGE` DI: `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY` 설정 시 Supabase Storage, 미설정 시 MemoryStorage fallback
- **Frontend**:
  - `MeSchema.avatarUrl` 필드 추가
  - `useUploadAvatar` 훅 (FormData → fetch 직접 호출, 성공 시 `["auth", "me"]` invalidate)
  - `ProfileForm` 상단 아바타 섹션 (이미지 표시 or 이니셜 placeholder, 클릭 시 파일 인풋)

## 테스트

- `supabase-storage.test.ts`: 8/8 PASS (mock Supabase client)
- `account.service.test.ts`: 3/3 PASS (MemoryStorage + 크기/MIME 오류 경로)
- 전체 typecheck: 54 packages PASS

## 주의

- 브랜치 기반: `phase-19-account-authz` (main에 미머지). phase-19 머지 후 `phase-20-data-ux`로 rebase 예정
- Supabase `avatars` 버킷은 수동으로 public 생성 필요 (대시보드 또는 migration SQL)
- `SUPABASE_SERVICE_ROLE_KEY` env var 필요 (`.env.example` 업데이트 포함)
