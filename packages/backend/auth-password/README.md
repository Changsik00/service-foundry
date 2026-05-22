# @repo/backend-auth-password

argon2id password hashing — ADR-0014 의 *암호 영역* 구현.

`hashPassword` / `verifyPassword` / `needsRehash` + OWASP Password Storage Cheat Sheet 2023 권장 cost. framework-agnostic pure crypto — apps/api 가 직접 import.

## 부트 가이드 (수동 검증)

```bash
pnpm --filter @repo/backend-auth-password typecheck
pnpm --filter @repo/backend-auth-password test
```

argon2 native binding 빌드가 자동 실행됨 — install 시점에 `cross-env ZERO_AR_DATE=1 node-gyp-build` 가 prebuild 사용 또는 fallback build. prebuild 실패 시 C++ toolchain 필요 (CI / Docker 환경에서 사전 verify).

## API

```ts
import { hashPassword, verifyPassword, needsRehash } from "@repo/backend-auth-password";

// 1. signup → hash 발급
const stored = await hashPassword("user-typed-password");
// → "$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>"

// 2. signin → verify
if (await verifyPassword("user-typed-password", stored)) {
  // 로그인 성공

  // 3. 정책 갱신 시 자동 rehash (선택)
  if (needsRehash(stored)) {
    const fresh = await hashPassword("user-typed-password");
    await userRepo.updatePasswordHash(userId, fresh);
  }
}

// 4. cost override (테스트 / 환경별 강화)
const tunedHash = await hashPassword("x", {
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 2,
  hashLength: 32,
});
```

## 핵심 설계 결정

| 항목 | 채택 | 이유 |
|---|---|---|
| **알고리즘** | argon2id | side-channel + GPU 양쪽 균형. ADR-0014. bcrypt/scrypt 비채택. |
| **라이브러리** | `argon2` (node-argon2) | OWASP cheatsheet 표준. native binding (prebuilt 다수). |
| **Default cost** | OWASP 2023 minimum (m=19MiB / t=2 / p=1 / hashLen=32) | 표준 권장. 환경별 강화 override 자연. |
| **`verifyPassword` 반환** | `Promise<boolean>` | wrong password 는 *예상 사용자 흐름* (false), malformed hash 는 *프로그래밍 오류* (throw `AppError(PASSWORD_HASH_MALFORMED)`). |
| **빈 input** | `hashPassword("")` → throw (`PASSWORD_EMPTY`), `verifyPassword("", h)` → false | hashPassword 는 *프로그래밍 오류*, verifyPassword 는 *사용자 흐름* (empty form). |
| **PHC string format** | 라이브러리 native (`$argon2id$v=19$m=...,t=...,p=...$<salt>$<hash>`) | `needsRehash` 가 옛 hash 의 cost 자동 파싱. |
| **`needsRehash` 사용 시점** | signin 후 *성공 직후 백그라운드* | UX 영향 0 — fresh hash 는 다음 signin 부터 적용. |

## Cost Parameter 정공법 (미래 검토)

본 spec 의 default 는 OWASP 2023 *minimum*. *full 정공법* 은 다음 영역.

### 본 spec 에 *박힘*

| 항목 | 값 |
|---|---|
| Default memory | 19 MiB |
| Default time | 2 iterations |
| Default parallelism | 1 |
| Default hashLength | 32 bytes (256-bit) |
| `needsRehash` | 정책 변경 시 옛 hash 식별 |

### 본 spec 에 *없음* (미래 검토)

| 항목 | 의미 | 박는 시점 후보 |
|---|---|---|
| **환경별 cost 동적 조정** | dev / staging / prod 다른 cost (prod 강화) | apps/api settings (spec-05-06 또는 별 spec) |
| **Cost auto-tuning** | 하드웨어 benchmark 박은 후 자동 cost 조정 (target: 100ms hash 시간) | phase-10 ops tooling |
| **Pepper (server-side secret)** | hash 전에 pepper 적용 — DB 유출만 으로는 crack 불가 | 별 spec — secret rotation 정책 필요 |
| **Password policy** (길이 / 복잡도 / dictionary check) | 약한 password 거부 | spec-05-06 password-reset endpoint zod schema |
| **Breach check** (haveibeenpwned API) | 유출된 password 거부 | 별 spec |
| **Legacy bcrypt / scrypt 호환 import** | 옛 시스템에서 마이그레이션 | 별 spec — `verifyLegacy` 함수 추가 |

## 본 패키지 scope 밖 (별 spec / phase)

- **Rate limit / account lockout** → spec-05-05 (`@repo/backend-auth-rate-limit`)
- **CSRF** → spec-05-05
- **NestJS adapter** (DI provider) → phase-06 (`@repo/nestjs-auth-password`)
- **Edge runtime** → 별 spec (`@noble/hashes/argon2id` 대체 라이브러리). 현 spec 은 Node 한정.
- **Pepper / breach check / policy** → README §Cost Parameter 정공법 참조

## 의존성

- `argon2 ^0.44.0` — node-argon2 (C++ binding).
- `@repo/errors` — AppError 발급 (`PASSWORD_EMPTY` / `PASSWORD_HASH_MALFORMED`).
