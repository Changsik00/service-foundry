# spec-x: auth 화면 구현 (로그인 개편 + 회원가입) + features/ 구조 개편

## 목적

DESIGN.md §6 스펙(#133)과 디자인 토큰(#134) 위에 실제 auth 화면을 구현 —
디자인 시스템의 첫 실전 적용이자 Audit Checklist 의 첫 실행.

## 변경 내용

### 1. features/auth 구조 (frontend ARCHITECTURE §2 첫 적용)

```
src/features/auth/{schema, LoginForm, SignupForm, GuestOnly, index.ts}
src/app/(auth)/{layout.tsx, login/, signup/}     ← 골격·가드는 layout 1곳
```
bare HTML 로그인 폼(useState 수동) 삭제 → RHF+Zod+shadcn.

### 2. 화면 (DESIGN §6)

- **로그인** — 라벨 상시 표시, 401 은 비밀번호 아래 enumeration-safe 인라인
- **회원가입** — 비밀번호 규칙 사전 고지(깜짝 에러 금지), 409 이메일 인라인, 성공 → 콘솔 직행
- **GuestOnly 가드** — 로그인 상태로 (auth) 접근 → `/`

### 3. SDK 수정 (fill-forward 발견 결함)

- `auth-supabase` signUp: 세션 부재(이메일 확인 활성) 시 `data.session!` **크래시 → `unverified_email` 반환**
- normalize: rate limit 메시지 대소문자 불문 (실서버는 소문자)
- SignupForm 분기: unverified_email → "확인 이메일" 안내 / rate_limited → 재시도 안내

### 4. 운영 노트 (Supabase Confirm email)

dev 프로젝트는 OFF (e2e 결정론 + 메일 rate limit 회피), **prod 는 ON 복원 필수** —
`env.sample` Supabase 섹션 + SignupForm 주석에 명문화. 코드는 양쪽 모두 대응.

### 5. frontend-ui FormMessage

`role="alert"` + 색 `text-error-text`(#b3261e) — destructive(#d44c47)는 텍스트 AA 미달 (DESIGN §2.4).

## 스코프 제외 (조사 근거)

- **테넌트 선택·초대 화면** → spec-x-org-screens: supabase 모드 api 는 /auth/me 만 마운트, org 표면 백엔드 선행 필요
- 소셜 로그인 버튼(OAuth 미구성 — filler 금지) / 비밀번호 재설정 flow

## 검증

- 단위 11+21 (TDD Red→Green) / **e2e 10/10** (회원가입 직행·가드 신규 3종 포함)
- turbo·knip·depcruise GREEN / DESIGN §8 Audit Checklist 7항 자가검증 (walkthrough)

## 후속

- spec-x-org-screens — provider 모드 org 백엔드 표면 + 테넌트 선택·초대 화면
