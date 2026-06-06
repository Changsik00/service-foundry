# Implementation Plan: spec-17-04

## 📋 Branch Strategy

- 신규 브랜치: `spec-17-04-personal-workspace-provisioning`
- 시작 지점: `phase-17`
- **PR 타겟**: `phase-17`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `ProvisionService`를 `apps/api/src/provision/` 에 신규 파일로 생성. 별도 패키지 불필요.
> - [ ] `SignupService.signUp()` 반환값에 `user.orgId`가 채워진 상태로 변경됨. 클라이언트 영향 없음 (추가 필드).

> [!WARNING]
> - [ ] `users.role` 에 `@deprecated` 주석 추가 — 런타임 영향 없음 (타입/값 변경 아님).
> - [ ] 기존 유저(이미 DB에 있는 행)는 `org_id = NULL` 유지. 이 spec은 신규 가입자만 대상.

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
apps/api/src/
  provision/
    provision.service.ts   ← NEW  (ProvisionService + inject token)
    provision.service.test.ts ← NEW

  auth/
    signup.service.ts      ← MODIFY (ProvisionService 주입 + 호출)
    signup.service.test.ts ← MODIFY (ProvisionService mock 추가)
    auth.module.ts         ← MODIFY (ProvisionService provider 등록)

  infra/schema/
    users.ts               ← MODIFY (@deprecated 주석)
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 위치 | `apps/api/src/provision/` | 단일 앱 내부 서비스. 별도 패키지화는 phase-18에서 재평가. |
| org slug | `randomUUID()` | 충돌 없음, 재시도 로직 불필요. (slug는 내부 식별자 — URL 노출은 추후 설계) |
| org name | `email.split('@')[0]` | 최소한의 식별 이름. 사용자가 나중에 변경 가능. |
| DI | `@Inject(DATABASE)` + `db.db` | Drizzle 트랜잭션 필요, OrgStore 별도 추상화 불필요 (직접 쿼리). |
| 트랜잭션 순서 | org → membership → user.orgId | FK 의존성 순서. |

- [x] ADR 없음

## 📂 Proposed Changes

### [NEW] `apps/api/src/provision/provision.service.ts`

```typescript
export const PROVISION_SERVICE = Symbol("PROVISION_SERVICE");

export interface IProvisionService {
  provisionUser(userId: string, email: string): Promise<void>;
}

@Injectable()
export class ProvisionService implements IProvisionService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async provisionUser(userId: string, email: string): Promise<void> {
    const db = this.database.db;
    await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: email.split("@")[0],
          slug: randomUUID(),
          isPersonal: true,
          ownerId: userId,
        })
        .returning({ id: organizations.id });

      await tx.insert(memberships).values({
        userId,
        orgId: org.id,
        role: "owner",
      });

      await tx
        .update(users)
        .set({ orgId: org.id })
        .where(eq(users.id, userId));
    });
  }
}
```

### [NEW] `apps/api/src/provision/provision.service.test.ts`

- mock DB transaction → 3개 Drizzle 쿼리 호출 순서 검증
- org INSERT 결과(id)가 membership INSERT와 user UPDATE에 전달되는지 확인

### [MODIFY] `apps/api/src/auth/signup.service.ts`

```typescript
constructor(
  ...기존 의존성,
  @Inject(PROVISION_SERVICE) private readonly provisionService: IProvisionService,
) {}

async signUp(...) {
  ...기존 로직...
  const user = await this.userStore.insert(...);
  // 세션 생성
  const { refreshToken } = await createSession(...);
  // ← NEW: 프로비저닝
  await this.provisionService.provisionUser(user.id, email);
  // accessToken 발급
  ...
}
```

### [MODIFY] `apps/api/src/auth/signup.service.test.ts`

`ProvisionService` mock 추가 → `provisionUser`가 올바른 인자로 호출되는지 검증.

### [MODIFY] `apps/api/src/auth/auth.module.ts`

```typescript
import { ProvisionService, PROVISION_SERVICE } from "../provision/provision.service.js";

providers: [
  ...기존,
  ProvisionService,
  { provide: PROVISION_SERVICE, useExisting: ProvisionService },
]
```

### [MODIFY] `apps/api/src/infra/schema/users.ts`

```typescript
/** @deprecated global role — OrgRole(owner|admin|member)로 대체 예정 (spec-17-05 이후 제거) */
role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
```

## 🧪 검증 계획

### 단위 테스트

```bash
pnpm --filter=@apps/api exec vitest run src/provision/provision.service.test.ts
pnpm --filter=@apps/api exec vitest run src/auth/signup.service.test.ts
```

### 타입체크

```bash
pnpm turbo run typecheck --filter=@apps/api
```

## 🔁 Rollback Plan

- `ProvisionService` 파일 삭제
- `SignupService`에서 provisionUser 호출 제거
- `auth.module.ts` provider 제거
- `users.org_id`는 NULL로 남음 (데이터 손상 없음)

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
