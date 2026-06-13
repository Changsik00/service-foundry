# spec-19-07: 계정 설정 UI

## 개요

계정 설정 페이지(`/account`)를 신규 구현한다. 이름 변경·비밀번호 변경·세션 관리·계정 삭제를 탭 구조로 제공하며, spec-19-01에서 구현된 API 3종(`PATCH /auth/account/profile`, `PATCH /auth/account/password`, `DELETE /auth/account`)을 연동한다.

## 변경 사항

### 신규
- `features/account/mutations.ts` — `useUpdateProfile` / `useChangePassword` / `useDeleteAccount` 훅
- `features/account/ProfileForm.tsx` — 이름 변경 폼 (현재값 prefill)
- `features/account/PasswordForm.tsx` — 비밀번호 변경 폼 (confirm 불일치 클라이언트 검증)
- `features/account/DeleteSection.tsx` — 계정 삭제 섹션 (2단계 클릭 확인)
- `app/(console)/account/page.tsx` — 계정 설정 페이지 (프로필 / 보안 탭)

### 수정
- `features/account/queries.ts` — `MeSchema`에 `displayName: z.string().nullable()` 추가
- `features/account/index.ts` — 신규 컴포넌트 re-export 추가
- `components/sidebar.tsx` — "계정 설정" 링크 추가

## 기술 메모

- `useDeleteAccount`: CSRF 토큰을 mutation 실행 시점에 `GET /auth/csrf`로 인라인 획득 → `DELETE /auth/account` 호출 → `authSDK.signOut()` 순서
- `PasswordForm`: confirm 불일치는 서버 호출 없이 클라이언트에서 에러 표시
- 탭 전환은 `useState` 로컬 상태로 관리 (URL 파라미터 불필요)

## 테스트

```
Test Files  3 passed (3)
Tests       9 passed (9)
```

- `mutations.test.ts` (3) — httpClient mock 기반 훅 동작 검증
- `ProfileForm.test.tsx` (3) — prefill / submit / 에러 표시
- `PasswordForm.test.tsx` (3) — confirm 불일치 / 정상 submit / API 에러 표시
