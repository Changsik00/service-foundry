# Implementation Plan: spec-20-01 아바타 업로드

## 📋 Branch Strategy

- 신규 브랜치: `spec-20-01-avatar-upload`
- 시작 지점: `phase-20-data-ux` (**phase-19-account-authz → main 머지 후**)

## 🎯 핵심 전략

### 계층 구조

```
Storage 포트 (packages/backend/storage) — 기존
    ↓
Supabase Storage 어댑터 (apps/api/src/infra/storage/supabase-storage.ts) — NEW
    ↓
AccountUserStore.updateAvatarUrl + findById avatarUrl 포함 — EXTEND
    ↓
AccountService.updateAvatar — EXTEND
    ↓
AccountController.POST /auth/account/avatar — NEW endpoint
ProviderMeController.GET /auth/me (avatarUrl DB 조회) — MODIFY
    ↓
ProfileForm.tsx 아바타 UI — MODIFY
```

### GET /auth/me 전략

`ProviderMeController.me()`는 현재 토큰 클레임만 반환한다. `avatarUrl`은 JWT에 넣으면 업로드 후 즉시 반영되지 않으므로 DB 조회로 제공한다. `AccountUserStore`를 주입해 `findById(user.sub)`로 `displayName`과 `avatarUrl`을 읽어 응답에 병합한다.

### multipart 처리 전략

NestJS `FileInterceptor("avatar")` + `@UploadedFile()` 사용. `multer` 설정에서 `limits.fileSize: 2 * 1024 * 1024` (2 MB) 적용. MIME 타입 검사는 컨트롤러에서 `file.mimetype`으로 허용 목록 확인.

### Supabase Storage 버킷 설정 (수동)

spec 구현 전 Supabase 대시보드에서 `avatars` 버킷을 **public**으로 생성해야 한다. 공개 URL 형식: `{SUPABASE_URL}/storage/v1/object/public/avatars/{key}`.

## 📂 변경 파일

### [NEW] `apps/api/src/infra/storage/supabase-storage.ts`

```typescript
// Storage 포트를 Supabase JS 클라이언트로 구현
export function createSupabaseStorage(
  client: SupabaseClient,
  bucket: string,
  publicBaseUrl: string,
): Storage
```

- `put`: `supabase.storage.from(bucket).upload(key, buffer, { upsert: true, contentType })`
- `get`: `.download(key)` → `Uint8Array`
- `del`: `.remove([key])`
- `exists`: `.list()` 검색
- `url`: `${publicBaseUrl}/storage/v1/object/public/${bucket}/${key}`

### [MODIFY] `apps/api/src/auth/account.stores.ts`

인터페이스에 추가:
```typescript
findById(id: string): Promise<{
  ...기존 필드...,
  avatarUrl: string | null;  // NEW
} | null>
updateAvatarUrl(id: string, url: string | null): Promise<void>;  // NEW
```

### [MODIFY] `apps/api/src/auth/account.service.ts`

메서드 추가:
```typescript
async updateAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string>
```

- 파일 크기·MIME 타입 검증 (서비스 레이어 재검증)
- 키: `avatars/${userId}` (사용자당 하나 — 덮어쓰기)
- `storage.put(key, buffer, { contentType })` → `url = storage.url(key)` → `store.updateAvatarUrl(userId, url)` → return url

### [MODIFY] `apps/api/src/auth/account.controller.ts`

엔드포인트 추가:
```typescript
@Post("avatar")
@UseGuards(AuthGuard)
@UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: 2 * 1024 * 1024 } }))
@HttpCode(200)
async uploadAvatar(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: AuthenticatedUser,
): Promise<{ status: "ok"; avatarUrl: string }>
```

- 허용 MIME: `image/jpeg`, `image/png`, `image/webp`
- MIME 불일치 → `BadRequestException`
- `accountService.updateAvatar(user.sub, file.buffer, file.mimetype)` 호출

### [MODIFY] `apps/api/src/auth/provider-me.controller.ts`

`AccountUserStore` 주입 추가 → `findById(user.sub)`로 `displayName`, `avatarUrl` 조회 → 응답에 병합:
```typescript
return {
  user: {
    ...user,
    displayName: profile?.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  },
};
```

### [MODIFY] `apps/api/src/infra/schema/users.ts`

```typescript
avatarUrl: text("avatar_url"),  // NEW
```

### [NEW] `apps/api/src/infra/migrations/0019_avatar_url.sql`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### [MODIFY] `apps/web/src/features/account/queries.ts`

`MeSchema` 사용자 객체에 추가:
```typescript
avatarUrl: z.string().url().nullable(),
```

### [MODIFY] `apps/web/src/features/account/mutations.ts`

새 훅 추가:
```typescript
export function useUploadAvatar(): UseMutationResult<string, Error, File>
```

- `POST /auth/account/avatar` — `FormData` + `avatar` 필드
- 성공 시 `["auth", "me"]` 캐시 무효화

### [MODIFY] `apps/web/src/features/account/ProfileForm.tsx`

아바타 섹션 추가:
- `useQuery(accountQueries.me())` 로 `avatarUrl` 읽기
- 이미지 있으면 `<img>`, 없으면 이니셜 `<div>` (이메일 첫 글자)
- `<input type="file" accept="image/jpeg,image/png,image/webp">` 변경 시 즉시 `mutate(file)`
- 업로드 중 `isPending` → 인풋 비활성화 + 스피너

---

## 🗂️ Tasks

### Task 1: DB 마이그레이션 + 스키마

```
[backend/schema]
1. apps/api/src/infra/migrations/0019_avatar_url.sql 생성
   - ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
2. apps/api/src/infra/schema/users.ts — avatarUrl 컬럼 추가
```

커밋: `chore(spec-20-01): avatar_url 마이그레이션 + 스키마`

### Task 2: Supabase Storage 어댑터 (TDD Red → Green)

```
[Red]
- apps/api/src/infra/storage/supabase-storage.test.ts
  - put() → Supabase upload 호출 확인
  - url() → 올바른 public URL 반환
  - del() → remove 호출 확인

[Green]
- apps/api/src/infra/storage/supabase-storage.ts 구현
```

커밋: `feat(spec-20-01): Supabase Storage 어댑터`

### Task 3: AccountUserStore + AccountService 확장 (TDD Red → Green)

```
[Red]
- AccountUserStore 인터페이스에 findById avatarUrl 포함, updateAvatarUrl 추가
- account.service.test.ts — updateAvatar 테스트 추가
  - 정상: put → url → updateAvatarUrl 순 호출
  - 오류: 파일 크기 초과 → Error throw

[Green]
- account.stores.ts 인터페이스 확장 + 구현체 updateAvatarUrl 메서드 추가
- account.service.ts — updateAvatar 메서드 추가
```

커밋: `feat(spec-20-01): AccountUserStore updateAvatarUrl + AccountService.updateAvatar`

### Task 4: POST /auth/account/avatar 엔드포인트 + GET /auth/me avatarUrl

```
[Backend]
- account.controller.ts — POST avatar 엔드포인트 추가
- provider-me.controller.ts — AccountUserStore 주입 + avatarUrl 응답 포함

[e2e test]
- apps/api/src/auth/avatar.e2e-spec.ts
  Given: 인증된 사용자
  When: POST /auth/account/avatar (JPEG 파일)
  Then: 200 + { status: "ok", avatarUrl: "https://..." }
  And: GET /auth/me → user.avatarUrl 반영
```

커밋: `feat(spec-20-01): POST /auth/account/avatar + GET /auth/me avatarUrl`

### Task 5: 프론트엔드 ProfileForm 아바타 UI

```
[mutations.ts]
- useUploadAvatar 훅 추가

[queries.ts]
- MeSchema avatarUrl 필드 추가

[ProfileForm.tsx]
- 아바타 표시 영역 (img / 이니셜 placeholder)
- file input → 변경 시 즉시 업로드
- isPending 상태 반영
```

커밋: `feat(spec-20-01): ProfileForm 아바타 업로드 UI`

### Task 6: ship

```
- walkthrough.md 작성
- pr_description.md 작성
- 브랜치 push + PR 생성
```

커밋: `docs(spec-20-01): walkthrough + pr_description`

---

## ⚙️ 환경 변수 추가

`apps/api/.env.example`에 추가:
```
SUPABASE_STORAGE_BUCKET=avatars
```

`SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 이미 존재한다고 가정.

---

## 🧪 테스트 전략

| 레이어 | 방식 | 파일 |
|---|---|---|
| Storage 어댑터 | 단위 (mock Supabase client) | `supabase-storage.test.ts` |
| AccountService.updateAvatar | 단위 (mock storage + store) | `account.service.test.ts` |
| avatar 엔드포인트 | e2e (실제 DB + mock storage) | `avatar.e2e-spec.ts` |
| ProfileForm UI | 수동 브라우저 검증 | — |

e2e에서는 `MemoryStorage`를 DI 오버라이드로 주입 (Supabase Storage 미연동) — 파일 업로드 흐름은 검증하되 외부 의존 없음.
