# Implementation Plan: spec-05-01 auth-contracts-extend

## 📋 Branch Strategy

- 신규 브랜치: `spec-05-01-auth-contracts-extend`
- 시작 지점: `phase-05-auth-core-security` (Phase Base Branch 모드)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] **AuthResult union** 3 variant (success / mfa_required / error reason)
> - [x] **`ts-pattern` 도입** (phase.md 흡수 — issue #19 Phase 5 후보)
> - [x] **5 schema 한 번에** (SignIn / SignUp / Refresh / PasswordReset / EmailVerify)
> - [x] **MfaChallenge interface 자리만** — 실 구현은 phase-07

> [!WARNING]
> - [ ] password schema 검증 — 본 spec 은 `z.string().min(8)` 만. 실 강도 검증 (특수문자 / 사전 단어 등) 은 spec-05-04 (auth-security) — *zod schema 자체* 가 *서버 검증* 의 *최소* (FE 친화)
> - [ ] *AuthResult* 의 *error reason* 종류 — `invalid_credentials` 등 *서버 응답 그대로 client 노출* — *enumeration 위험* 검토 필요 (ADR-0014). 본 spec 은 *schema 정의* 만, 실 응답은 spec-05-05 에서 *masking* 검토

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **AuthResult union 형태** | `{ success: true / false } + reason` | shadcn ts-pattern 시연 자연. discriminated union 표준 |
| **MfaChallenge 위치** | auth-contracts 안 interface 자리 | phase-07 진입 시 *MFA 구현* 시점에 *interface 가 이미 박혀있어* 자연 |
| **schema 분리 — Input/Output** | Input 만 (Schema = z.object) — Output 은 *유추* | 본 spec 은 *endpoint input* 정의. response 는 *AuthResult* 또는 *간단 object* — 별 spec |
| **`ts-pattern` 채택** | `match()` + `.exhaustive()` 검증 시연 | exhaustiveness check — switch 보다 안전 |
| **password 검증 깊이** | `z.string().min(8).max(128)` | 본 spec 은 *최소* — 실 강도 검증 (zxcvbn 등) 별 spec |
| **`displayName` optional** | optional in SignUp | 자유도 ↑ — 후속 진입 시 *required* 박을 수도 |
| **token 길이** | `z.string().min(20)` (URL-safe random 가정) | 실 토큰 생성/검증은 spec-05-02 (auth-session) |
| **catalog 신규** | `ts-pattern: ^5.x` | dep 작음 (~2KB gzip) |

## 📂 Proposed Changes

### catalog

#### [MODIFY] `pnpm-workspace.yaml`
- `ts-pattern: ^5.x` (install 시점 latest)

### `@repo/auth-contracts` 확장

#### [MODIFY] `packages/shared/auth-contracts/package.json`
- dependencies: `ts-pattern` catalog

#### [MODIFY] `packages/shared/auth-contracts/src/index.ts`
신규 schema + AuthResult union + MfaChallenge:

```ts
// 의사코드 — 실 구현은 task
export const Password = z.string().min(8).max(128);
export const Token = z.string().min(20);

export const SignInInput = z.object({ email: Email, password: Password });
export const SignUpInput = z.object({
  email: Email,
  password: Password,
  displayName: z.string().min(1).max(100).optional(),
});
export const RefreshInput = z.object({ refreshToken: Token });
export const PasswordResetRequest = z.object({ email: Email });
export const PasswordResetConfirm = z.object({ token: Token, newPassword: Password });
export const EmailVerifyRequest = z.object({ email: Email });
export const EmailVerifyConfirm = z.object({ token: Token });

export type SignInInput = z.output<typeof SignInInput>;
// ... (각각 type alias)

export interface MfaChallenge {
  challengeId: string;
  method: "totp" | "passkey";
  expiresAt: string; // ISO
}

export type AuthResult =
  | { success: true; user: User; session: Session }
  | { success: false; reason: "mfa_required"; challenge: MfaChallenge }
  | {
      success: false;
      reason: "invalid_credentials" | "rate_limited" | "account_locked" | "unverified_email";
    };
```

#### [NEW] `packages/shared/auth-contracts/src/index.test.ts`
- 5 schema parse — valid + invalid (이메일 형식 / password length / token length)
- AuthResult union — ts-pattern `match` + `.exhaustive()` 시연

### depcruise

- shared package — framework dep 0 룰 유지 (`@repo/auth-contracts` 는 zod / ts-pattern 만 — NestJS/React 박지 말 것)

## 🧪 검증

```bash
pnpm --filter @repo/auth-contracts test
pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
```

## 📦 Deliverables 체크

- [x] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough/pr_description ship
