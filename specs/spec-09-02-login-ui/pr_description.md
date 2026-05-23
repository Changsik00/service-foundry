# PR: spec-09-02 로그인 UI 페이지 (web-next)

## Summary

- `LoginForm` Client Component 추가 — 이메일 + 비밀번호 폼, `useAuth().signIn()` 연결
- `/login` 라우트 (Server Component) 추가 — LoginForm 렌더링
- 성공 시 `router.push('/')`, 실패 시 "이메일 또는 비밀번호가 올바르지 않습니다." 에러 메시지 표시
- 현재 Mock SDK(createMockAuthSDK) 기반 동작 — 실 백엔드 연결은 spec-09-03

## Changed Files

| 파일 | 변경 |
|---|---|
| `apps/web-next/src/components/login-form.tsx` | NEW — LoginForm Client Component |
| `apps/web-next/src/components/login-form.test.tsx` | NEW — TDD 4 test cases |
| `apps/web-next/src/app/login/page.tsx` | NEW — /login Server Component |

## Test Results

```
Test Files  2 passed (2)
Tests       11 passed (11)
```

`pnpm -r typecheck` → 39 packages PASS

## Test Plan

- [x] `pnpm --filter @apps/web-next test` PASS
- [x] `pnpm -r typecheck` PASS
- [x] localhost:2027/login → HTTP 200, LoginForm 렌더 확인
- [x] TDD Red → Green 순서 준수 (커밋 히스토리 확인)
