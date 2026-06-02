# feat(spec-05-01): auth-contracts-extend — 7 schema + AuthResult union + ts-pattern

> phase-05 첫 spec. `@repo/auth-contracts` 확장 — 5 endpoint flow 의 input schema + AuthResult discriminated union + MfaChallenge interface + `ts-pattern` 도입 (#19 Phase 5 후보 흡수).

## 📋 Summary

### 신규 (`packages/shared/auth-contracts/src/index.ts`):

**Primitives**:
- `Password`: `z.string().min(8).max(128)` — 최소 검증 (강도 검증은 spec-05-04)
- `Token`: `z.string().min(20)` — URL-safe random 가정

**7 Auth flow schemas**:
- `SignInInput` / `SignUpInput` (displayName optional) / `RefreshInput`
- `PasswordResetRequest` / `PasswordResetConfirm`
- `EmailVerifyRequest` / `EmailVerifyConfirm`

**`MfaChallenge` interface** (자리만, phase-07 실 구현):
```ts
interface MfaChallenge {
  challengeId: string;
  method: "totp" | "passkey";
  expiresAt: string;
}
```

**`AuthResult` discriminated union** (3 variant):
```ts
type AuthResult =
  | { success: true; user: User; session: Session }
  | { success: false; reason: "mfa_required"; challenge: MfaChallenge }
  | { success: false; reason: "invalid_credentials" | "rate_limited" | "account_locked" | "unverified_email" };
```

**catalog**: `ts-pattern ^5.9.0`

## 🎯 Key Review Points

1. **ts-pattern `match().exhaustive()`** — discriminated union 안전 처리. 후속 reason 추가 시 *typecheck error* 가 *처리 누락* 박음.

2. **`MfaChallenge` 자리 박음** — phase-07 진입 시 *interface 이미 박혀있어* 자연.

3. **error reason 4종** — `invalid_credentials / rate_limited / account_locked / unverified_email`. 실 endpoint 응답 (spec-05-05) 에서 *enumeration 방지 masking* 검토 — 본 spec 은 *server-internal schema* 만.

4. **Token / Password primitive 분리** — 후속 spec 재사용 자연.

5. **shared 패키지 — framework dep 0** — zod / ts-pattern 만 의존.

6. **#19 Phase 5 후보 (`ts-pattern`) 흡수** — phase.md 명시 → 본 spec 채택.

## 🧪 Verification

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
```

- ✅ lint: 20 tasks
- ✅ typecheck: 20 tasks FULL TURBO
- ✅ test: **196 PASS** (auth-contracts 6 → 23, +17 신규)
- ✅ depcruise: 0 violations (130 modules / 189 deps)

## 🔗 참조

- ADR-0006 (Auth Platform), ADR-0008 (Result), ADR-0009 (AppError)
- design note `docs/notes/auth-foundation-architecture.md`
- Refs #19 (Phase 5 후보 ts-pattern 흡수)

## 📝 Post-Merge

- [ ] Merge → `phase-05-auth-core-security` (Phase Base Branch 모드)
- [ ] spec-05-02 (auth-session) 진입 옵션
