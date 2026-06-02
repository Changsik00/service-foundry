# Walkthrough: spec-06-02 — React 인증 어댑터 (auth-react)

## 증거 로그

### 전체 테스트 (11 tests PASS)

```
✓ src/provider.test.tsx   6 tests
✓ src/guards.test.tsx     5 tests

Test Files  2 passed (2)
Tests       11 passed (11)
Duration    778ms
```

### Typecheck & Biome

```
turbo typecheck: 26 successful, 26 total
biome check src/: Checked 7 files. No fixes applied.
```

### 커밋 목록

```
8590742 feat(spec-06-02): RequireAuth + RequireRole guards + index.ts
2445989 feat(spec-06-02): AuthProvider + useAuth + useSession hooks
a329202 chore(spec-06-02): @repo/frontend-auth-react 패키지 스캐폴드
bba51c0 feat(spec-06-02): auth-contracts — AuthSDK Core Surface interface
```

---

## 설계 결정 기록

### 1. `AuthSDK` 위치: `auth-contracts`

`auth-react` 에 정의하면 future `auth-firebase` / `auth-supabase` 패키지가 `auth-react` 에 역방향 의존해야 한다. 공유 contracts 에 위치시켜 의존 방향을 단방향으로 유지.

### 2. 상태 모델: `{ user: User | null; isLoading: boolean }`

Session 별도 추적 없음. `signIn` 성공 시 반환된 `session` 은 현재 Context 에 저장하지 않는다. Cookie 전략(spec-06-03) 이후 필요시 `session` 필드 추가 결정. YAGNI.

### 3. `useSession()` = read-only alias

`useAuth()` 의 `{ user, isLoading }` subset 반환. action 없는 순수 읽기 용도 분리 — consumer 코드에서 불필요한 action 노출 방지.

### 4. Biome `useValidAriaRole` — biome-ignore

`<RequireRole role="admin">` 의 `role` prop 을 Biome 이 HTML ARIA role attribute 로 오인. 커스텀 컴포넌트의 `role` prop 이므로 `biome-ignore lint/a11y/useValidAriaRole` 주석 추가.

### 5. `--unsafe` auto-fix 사이드 이펙트

Biome `--write --unsafe` 실행 시 `role="admin"` prop 을 제거(ARIA role 무효화 처리). 테스트 실패 원인. 이후 수동으로 biome-ignore 주석과 함께 prop 복원. `--unsafe` auto-fix 는 테스트 코드에서 주의 필요.
