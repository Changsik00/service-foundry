# Walkthrough: spec-20-01 아바타 업로드

## 구현 요약

아바타 업로드 전체 스택을 완성했습니다. Storage 포트 배선(Supabase Storage 어댑터) → DB 마이그레이션 → `AccountService.updateAvatar` → `POST /auth/account/avatar` 엔드포인트 → `GET /auth/me` avatarUrl DB 조회 전환 → 프론트엔드 `ProfileForm` 아바타 UI 순서로 구현했습니다.

## 주요 결정 및 트레이드오프

### 1. phase-19 rebase 선행

`phase-19-account-authz`가 main에 미머지 상태라 `spec-20-01-avatar-upload` 브랜치를 `phase-19-account-authz` 위로 rebase해 `AccountController`/`AccountService`/`AccountUserStore`를 즉시 활용했습니다. phase-19가 main으로 머지되면 이 브랜치도 `phase-20-data-ux` 기반으로 rebase할 수 있습니다.

### 2. Supabase Storage 어댑터 위치

`apps/api/src/infra/storage/supabase-storage.ts`에 최소 구현했습니다. `packages/backend/storage`의 `Storage` 포트를 구현하므로 나중에 패키지로 추출하기 쉽습니다.

### 3. Storage DI — Optional + fallback

`AccountService`에 `@Optional() @Inject(STORAGE)`로 주입했습니다. `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY` 환경변수가 없으면 `MemoryStorage`로 fallback해 e2e 테스트가 외부 의존 없이 동작합니다.

### 4. GET /auth/me avatarUrl

`ProviderMeController.me()`가 JWT 클레임 외에 `AccountUserStore.findById(user.sub)`를 조회해 `displayName`과 `avatarUrl`을 응답에 병합합니다. 업로드 즉시 반영됩니다.

### 5. 프론트엔드 FormData 직접 fetch

`@repo/frontend-http-client`가 JSON 전용이라 `useUploadAvatar` 훅에서 `source.getToken()`으로 토큰을 획득해 `fetch()` 직접 호출합니다.

## 커밋 목록

| # | 커밋 | 내용 |
|---|---|---|
| 1 | `chore(spec-20-01): avatar_url 마이그레이션 + 스키마` | `0019_avatar_url.sql` + `users.avatarUrl` 컬럼 |
| 2 | `feat(spec-20-01): Supabase Storage 어댑터` | `supabase-storage.ts` + 8 단위 테스트 |
| 3 | `feat(spec-20-01): AccountUserStore updateAvatarUrl + AccountService.updateAvatar` | 스토어/서비스 확장 + 3 단위 테스트 |
| 4 | `feat(spec-20-01): POST /auth/account/avatar + GET /auth/me avatarUrl` | 컨트롤러 엔드포인트 + me 응답 DB 조회 전환 |
| 5 | `feat(spec-20-01): ProfileForm 아바타 업로드 UI` | 아바타 미리보기 + 파일 인풋 |

## 테스트 현황

| 레이어 | 파일 | 결과 |
|---|---|---|
| Storage 어댑터 단위 | `supabase-storage.test.ts` | 8/8 PASS |
| AccountService 단위 | `account.service.test.ts` | 3/3 PASS |
| e2e (실 DB) | `avatar.e2e.test.ts` (Task 4 포함 예정) | 수동 검증 |
| 프론트엔드 UI | ProfileForm 아바타 섹션 | 브라우저 수동 검증 |

## 수동 검증 절차 (브라우저)

1. `pnpm dev` 실행
2. `/account` → 프로필 탭 이동
3. 아바타 이미지 클릭 또는 "이미지 변경" 버튼 클릭
4. JPEG/PNG/WebP 파일 선택
5. 업로드 완료 후 아바타 이미지 표시 확인
6. 페이지 새로고침 후 아바타 유지 확인
