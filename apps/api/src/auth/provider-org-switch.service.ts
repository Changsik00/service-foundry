import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { memberships, organizations, users } from "@repo/backend-schema";
import { runWithSystemTenant, TENANT_ALS, type TenantAls } from "@repo/backend-tenant";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";

/**
 * provider 모드 org 전환 — `users.orgId` UPDATE (ADR-0026).
 *
 * 토큰 재발급 없음: SupabaseVerifier 의 provision fallback 이 매 요청 DB 를 읽으므로
 * 다음 요청부터 즉시 적용. 대상 org 멤버십 조회는 현재 active org 의 RLS 에 가려지므로
 * 시스템 컨텍스트로 실행 (동일 tx — 원자성 유지).
 */
@Injectable()
export class ProviderOrgSwitchService {
  constructor(
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
    @Inject(TENANT_ALS) private readonly als: TenantAls,
  ) {}

  async switch(providerUid: string, newOrgPublicId: string): Promise<{ orgId: string }> {
    return runWithSystemTenant(this.als, async () => {
      // 입력 org public_id → 내부 id 해석(없으면 fail-close, ADR-0029).
      const [org] = await this.database.db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.publicId, newOrgPublicId));
      if (!org) throw new ForbiddenException("org not found");
      const newOrgId = org.id;

      const [user] = await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.providerUid, providerUid));
      if (!user) throw new ForbiddenException("user not found");

      const [membership] = await this.database.db
        .select({ id: memberships.id })
        .from(memberships)
        .where(and(eq(memberships.userId, user.id), eq(memberships.orgId, newOrgId)));
      if (!membership) throw new ForbiddenException("membership not found");

      await this.database.db.update(users).set({ orgId: newOrgId }).where(eq(users.id, user.id));
      // 응답은 외부 식별자(public_id) 그대로 echo.
      return { orgId: newOrgPublicId };
    });
  }
}
