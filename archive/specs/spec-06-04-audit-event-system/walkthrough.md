# Walkthrough: spec-06-04

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| auth-audit 위치 | auth-session 흡수 vs 별도 패키지 | `packages/backend/auth-audit` 별도 | ADR-0006 §95 명시 + 다른 패키지에서도 emit 가능해야 함 |
| 이벤트 emit 위치 | Service vs Controller | AuthController | HTTP context(IP/UA)에 접근 필요; 서비스는 순수 도메인 로직 유지 |
| AuditStore 인터페이스 | Drizzle 직접 mock vs Store 인터페이스 | Store 인터페이스 패턴 | auth-session 패턴 일관성 + 테스트 독립성 (실DB 불필요) |
| biome import type 충돌 | type import 허용 vs biome-ignore | biome-ignore 추가 | NestJS DI는 런타임 클래스 참조 필요 — type import 시 DI 실패 |

### ADR 승격 가이드

- [x] 없음 (audit 패키지 분리는 ADR-0006에 이미 결정됨)

## 💬 사용자 협의

- **주제**: spec-06-04 시작 방향
  - **사용자 의견**: spec-06-04 바로 시작
  - **합의**: Inter-Spec Re-Validation 후 방향 유효 확인 → 진행

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트 — `@repo/backend-auth-audit`

- **명령**: `pnpm --filter @repo/backend-auth-audit test`
- **결과**: ✅ Passed (7 tests)
- **로그 요약**:
```
✓ src/event-bus.test.ts (4 tests) 2ms
✓ src/audit.service.test.ts (3 tests) 2ms
Test Files  2 passed (2)
Tests       7 passed (7)
```

#### 단위 테스트 — `@apps/api`

- **명령**: `pnpm --filter @apps/api test`
- **결과**: ✅ Passed (35 tests, 11 skipped — e2e DB 없음 skip)
- **로그 요약**:
```
✓ src/auth/auth.controller.test.ts (10 tests) — emit 검증 5개 포함
✓ src/auth/signin.service.test.ts (3 tests)
✓ src/auth/signup.service.test.ts (3 tests)
✓ src/auth/password-reset.service.test.ts (3 tests)
✓ src/auth/password-reset.confirm.service.test.ts (7 tests)
✓ src/auth/email-verify.service.test.ts (3 tests)
✓ src/auth/email-verify.confirm.service.test.ts (4 tests)
✓ src/jwt/jwks.controller.test.ts (2 tests)
Tests  35 passed | 11 skipped (46)
```

#### Typecheck

- **명령**: `pnpm turbo typecheck`
- **결과**: ✅ 27 Tasks successful

### 2. 수동 검증

1. **Action**: `git log --oneline spec-06-04-audit-event-system ^phase-06-auth-integration`
   - **Result**: 3개 feat commit — 태스크 순서대로 정확히 분리됨

## 🔍 발견 사항

- **biome import type 자동 변환 함정**: biome pre-commit hook이 `import { AuthEventBus }` → `import type { AuthEventBus }`로 변환해 NestJS DI를 깨뜨림. `// biome-ignore lint/style/useImportType` 주석이 NestJS injectable 클래스에 필수임을 재확인. (spec-06-01 때도 같은 패턴 적용 완료 — 이번에도 동일)
- **Drizzle schema 타입 cast**: `drizzleAuditLogStore(db.db as ...)` — AuthModule의 DATABASE provider는 `NodePgDatabase<Record<string, unknown>>`이지만 실제 런타임에는 appSchema가 적용됨. cast가 필요하나 타입 안전성은 appSchema에서 보장.

## 🚧 이월 항목

- **PASSWORD_CHANGED emit**: PasswordResetService.confirm 호출 후 컨트롤러에서 userId를 알 수 없어 이번 spec에서 emit 제외. 다음 방법이 필요: confirm()이 userId 반환하거나, 서비스에서 직접 emit. → Icebox 후보
- **MFA_ENROLLED / SUSPICIOUS_ACTIVITY emit**: phase-07/10 범위 — 타입 정의만 완료.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-21 |
| **최종 commit** | `8866b38` |
