# Plan: spec-17-06

## 구현 전략

### 패턴 참조

- 토큰 생성·해시: `password-reset.service.ts` 와 동일 패턴 (`generateRefreshToken` + `hashToken`)
- 이메일 발송: `NOTIFIER` DI, `buildInvitationEmail` 사용
- 새 accessToken 발급: `org-switch.service.ts` 와 동일 패턴 (`signAccessToken`)
- 멤버십 검증: `org-switch.service.ts` 의 `.select().from(memberships).where(...)` 패턴

### 파일 계획

| 파일 | 변경 | 설명 |
|---|---|---|
| `apps/api/src/auth/org-invite.service.ts` | NEW | OrgInviteService (invite + accept) |
| `apps/api/src/auth/org-invite.service.test.ts` | NEW | 단위 테스트 |
| `packages/shared/auth-contracts/src/index.ts` | MODIFY | OrgInviteInput, OrgInviteAcceptInput |
| `apps/api/src/auth/auth.controller.ts` | MODIFY | POST /auth/org/invite, POST /auth/org/invite/accept |
| `apps/api/src/auth/auth.controller.test.ts` | MODIFY | OrgInviteService mock 추가 |
| `apps/api/src/auth/auth.module.ts` | MODIFY | OrgInviteService provider 추가 |

### OrgInviteService 설계

```typescript
@Injectable()
export class OrgInviteService {
  constructor(
    @Inject(DATABASE) private readonly database: Database<...>,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(FRONTEND_URL) private readonly frontendUrl: string,
  ) {}

  async invite(
    inviterId: string,
    orgId: string,
    email: string,
    role: "admin" | "member",
  ): Promise<void>

  async accept(
    userId: string,
    token: string,
  ): Promise<{ accessToken: string }>
}
```

### invite() 로직

1. `memberships` 에서 `(inviterId, orgId)` 조회 → role이 owner/admin 아니면 ForbiddenException
2. `organizations` 에서 orgId → name 조회
3. `generateRefreshToken()` → plain token / `hashToken(token)` → tokenHash
4. `expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)`
5. `invitations.insert({ orgId, email, tokenHash, role, invitedBy: inviterId, expiresAt })`
6. `buildInvitationEmail(org.name, token, frontendUrl)` → `notifier.sendEmail({ ...msg, to: email })`

### accept() 로직

1. `hashToken(token)` → `invitations.findByTokenHash(tokenHash)`
2. invitation 없음 → NotFoundException
3. `invitation.expiresAt < new Date()` → GoneException
4. `invitation.acceptedAt` → ConflictException
5. `memberships.insert({ userId, orgId: invitation.orgId, role: invitation.role })`
6. `invitations.update({ acceptedAt: new Date() }).where(id = invitation.id)`
7. `signAccessToken({ sub: userId, activeOrgId: invitation.orgId, orgRole: invitation.role }, ...)`

### Controller 라우트

```typescript
@Post("org/invite")
@UseGuards(AuthGuard)
@HttpCode(200)
async orgInvite(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
  const { email, role } = zodPipe(OrgInviteInput).transform(body);
  if (!user.orgId) throw new ForbiddenException("no active org");
  await this.orgInviteService.invite(user.sub, user.orgId, email, role);
  return { status: "ok" };
}

@Post("org/invite/accept")
@UseGuards(AuthGuard)
@HttpCode(200)
async orgInviteAccept(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
  const { token } = zodPipe(OrgInviteAcceptInput).transform(body);
  return this.orgInviteService.accept(user.sub, token);
}
```

### Contracts 추가

```typescript
export const OrgInviteInput = z.object({
  email: Email,
  role: z.enum(["admin", "member"]),
});
export const OrgInviteAcceptInput = z.object({ token: Token });
```

## 테스트 계획

### OrgInviteService 단위 테스트

**invite()**
- inviter가 owner → 초대 성공, notifier.sendEmail 호출됨
- inviter가 member → ForbiddenException

**accept()**
- 유효 토큰 → memberships 삽입 + acceptedAt 업데이트 + accessToken 반환
- 토큰 없음 → NotFoundException
- 만료 → GoneException
- 이미 수락 → ConflictException

### auth.controller.test.ts

- OrgInviteService mock 추가 (invite: vi.fn(), accept: vi.fn())

## 검증 게이트

- 단위 테스트 PASS
- `pnpm turbo run typecheck --filter=@apps/api --filter=@repo/auth-contracts` PASS
- `pnpm turbo run lint --filter=@apps/api` PASS
