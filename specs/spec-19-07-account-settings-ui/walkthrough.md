# Walkthrough: spec-19-07 계정 설정 UI

## 구현 요약

계정 설정 페이지(`/account`)를 신규 구현했다. 이름 변경·비밀번호 변경·세션 관리·계정 삭제 4가지 기능을 탭 구조로 제공한다.

## 변경 파일

| 파일 | 유형 | 설명 |
|---|---|---|
| `apps/web/src/features/account/mutations.ts` | NEW | 계정 변경 뮤테이션 훅 3종 |
| `apps/web/src/features/account/queries.ts` | MOD | MeSchema에 `displayName` 필드 추가 |
| `apps/web/src/features/account/ProfileForm.tsx` | NEW | 이름 변경 폼 |
| `apps/web/src/features/account/PasswordForm.tsx` | NEW | 비밀번호 변경 폼 |
| `apps/web/src/features/account/DeleteSection.tsx` | NEW | 계정 삭제 섹션 (2단계 확인) |
| `apps/web/src/features/account/index.ts` | MOD | 신규 컴포넌트 re-export 추가 |
| `apps/web/src/app/(console)/account/page.tsx` | NEW | 계정 설정 페이지 (탭 구조) |
| `apps/web/src/components/sidebar.tsx` | MOD | "계정 설정" 사이드바 링크 추가 |

## 주요 설계 결정

### CSRF 처리
`DELETE /auth/account`는 CsrfGuard를 통과해야 한다. 별도 CSRF 상태 없이 mutation 실행 시점에 `GET /auth/csrf`를 인라인 호출해 토큰을 획득한다 (`useDeleteAccount` 내부). 이 패턴은 auth-api.ts의 `withCsrfRetry` 로직을 복사하지 않고 단순하게 유지한다.

### 계정 삭제 확인 패턴
`DeleteSection`은 2단계 클릭 확인(첫 클릭 → 인라인 확인 버튼 노출 → 두 번째 클릭)을 사용한다. `window.confirm`은 UI 일관성이 깨지고 테스트가 어려워 채택하지 않았다.

### ProfileForm prefill
`useQuery(accountQueries.me())`로 현재 displayName을 가져와 입력 필드를 prefill한다. 쿼리 데이터가 없는 초기 상태에서는 빈 문자열로 렌더링되고, 데이터 로드 후 state 동기화를 통해 값이 채워진다.

### 탭 구조
URL 파라미터 없이 React 로컬 `useState`로 탭 전환한다. 계정 설정 내 탭 상태는 브라우저 히스토리에 보존될 필요가 없다.

## 테스트 현황

| 테스트 파일 | 테스트 수 | 상태 |
|---|---|---|
| `mutations.test.ts` | 3 | PASS |
| `ProfileForm.test.tsx` | 3 | PASS |
| `PasswordForm.test.tsx` | 3 | PASS |

```
pnpm --filter @apps/web exec vitest run src/features/account/
Test Files  3 passed (3)
Tests       9 passed (9)
```

## 커밋 목록

| 커밋 | 설명 |
|---|---|
| `e15edb7` | test(spec-19-07): account mutations 단위 테스트 (Red) |
| `5d59300` | feat(spec-19-07): account mutations + queries displayName |
| `1acd022` | test(spec-19-07): ProfileForm 단위 테스트 (Red) |
| `0e2f7e7` | feat(spec-19-07): ProfileForm — 이름 변경 |
| `4576f0e` | test(spec-19-07): PasswordForm 단위 테스트 (Red) |
| `0c96a00` | feat(spec-19-07): PasswordForm — 비밀번호 변경 |
| `7ef18f6` | feat(spec-19-07): account/page + sidebar + DeleteSection |
