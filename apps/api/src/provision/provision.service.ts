import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { memberships, organizations, users } from "@repo/backend-schema";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";

export const PROVISION_SERVICE = Symbol("PROVISION_SERVICE");

export interface IProvisionService {
  provisionUser(userId: string, email: string): Promise<{ orgId: string; orgRole: string }>;
  provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }>;
  getOrgMembership(
    providerUid: string,
    orgId: string,
  ): Promise<{ orgRole: string; internalUserId: string } | null>;
  resolveInternalUserId(providerUid: string): Promise<string | null>;
}

@Injectable()
export class ProvisionService implements IProvisionService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }> {
    return this.database.db.transaction(async (tx) => {
      // provider_uid로 기존 유저 조회
      const existing = await tx
        .select()
        .from(users)
        .where(eq(users.providerUid, uid))
        .limit(1)
        .then((r) => r[0]);

      let userId: string;
      let currentOrgId: string | null;

      if (existing) {
        userId = existing.id;
        currentOrgId = existing.orgId ?? null;
      } else {
        // uid 미발견이어도 동일 email 기존 계정이 있으면 재링크 — provider 유저 재생성/이전 시
        // insert 가 email unique 에 충돌한다 (spec-x-org-api 발견). provider 가 email 권위 (ADR-0023).
        const byEmail = await tx
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
          .then((r) => r[0]);

        if (byEmail) {
          await tx.update(users).set({ providerUid: uid }).where(eq(users.id, byEmail.id));
          userId = byEmail.id;
          currentOrgId = byEmail.orgId ?? null;
        } else {
          // 신규 유저 생성
          const [created] = await tx
            .insert(users)
            .values({ email, providerUid: uid })
            .returning({ id: users.id, orgId: users.orgId });
          userId = created!.id;
          currentOrgId = null;
        }
      }

      if (currentOrgId) {
        return { orgId: currentOrgId, orgRole: "owner", internalUserId: userId };
      }

      // org 없으면 프로비저닝 (provisionUser의 트랜잭션 내 로직 인라인)
      const [org] = await tx
        .insert(organizations)
        .values({
          name: email.split("@")[0] ?? email,
          slug: randomUUID(),
          isPersonal: true,
          ownerId: userId,
        })
        .returning({ id: organizations.id });

      await tx.insert(memberships).values({ userId, orgId: org!.id, role: "owner" });
      await tx.update(users).set({ orgId: org!.id }).where(eq(users.id, userId));

      return { orgId: org!.id, orgRole: "owner", internalUserId: userId };
    });
  }

  /**
   * providerUid 가 orgId 의 멤버인지 확인 (active_org 클레임 게이트, spec-26-04 A).
   * verifier 단계(인터셉터 이전)라 RLS 컨텍스트가 없어 permissive — 시스템 레벨 멤버십 조회로 동작.
   */
  async getOrgMembership(
    providerUid: string,
    orgId: string,
  ): Promise<{ orgRole: string; internalUserId: string } | null> {
    const rows = await this.database.db
      .select({ role: memberships.role, userId: users.id })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(and(eq(users.providerUid, providerUid), eq(memberships.orgId, orgId)))
      .limit(1);
    const row = rows[0];
    return row ? { orgRole: row.role, internalUserId: row.userId } : null;
  }

  /** providerUid → 내부 users.id (sub 정규화용, spec-x-auth-sub-normalize). 미존재 시 null. */
  async resolveInternalUserId(providerUid: string): Promise<string | null> {
    const rows = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.providerUid, providerUid))
      .limit(1);
    return rows[0]?.id ?? null;
  }

  async provisionUser(userId: string, email: string): Promise<{ orgId: string; orgRole: string }> {
    return this.database.db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: email.split("@")[0] ?? email,
          slug: randomUUID(),
          isPersonal: true,
          ownerId: userId,
        })
        .returning({ id: organizations.id });

      // INSERT with RETURNING always yields a row; org! is safe here
      await tx.insert(memberships).values({
        userId,
        orgId: org!.id,
        role: "owner",
      });

      await tx.update(users).set({ orgId: org!.id }).where(eq(users.id, userId));

      return { orgId: org!.id, orgRole: "owner" };
    });
  }
}
