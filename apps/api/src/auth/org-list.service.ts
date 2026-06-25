import { Inject, Injectable } from "@nestjs/common";
import type { OrgRole } from "@repo/auth-contracts";
import { memberships, organizations, users } from "@repo/backend-schema";
import { runWithSystemTenant, TENANT_ALS, type TenantAls } from "@repo/backend-tenant";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { asc, eq } from "drizzle-orm";

/** 무제한 스캔 방지 상한 (A5). 1인 소속 org 수는 소수 — 운영 충분, 병리적 증가만 차단. */
const ORG_LIST_MAX = 100;

export interface OrgSummary {
  orgId: string;
  name: string;
  role: OrgRole;
  isPersonal: boolean;
}

/**
 * 내 멤버십 전체 (org 정보 포함) — 테넌트 스위처/조직 선택 화면의 데이터 소스.
 *
 * 교차-org 조회: memberships 는 org-RLS 스코프라 active org 컨텍스트로는 내 다른 조직이
 * 가려진다 → 시스템 컨텍스트로 실행 (invite accept 와 같은 정당한 cross-org 패턴, ADR-0026).
 * provider 모드의 user.sub = provider uid — users.providerUid 로 내부 유저를 해석한다.
 */
@Injectable()
export class OrgListService {
  constructor(
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
    @Inject(TENANT_ALS) private readonly als: TenantAls,
  ) {}

  async listForProviderUid(providerUid: string): Promise<OrgSummary[]> {
    return runWithSystemTenant(this.als, async () => {
      const rows = await this.database.db
        .select({
          orgId: memberships.orgId,
          name: organizations.name,
          role: memberships.role,
          isPersonal: organizations.isPersonal,
        })
        .from(memberships)
        .innerJoin(organizations, eq(memberships.orgId, organizations.id))
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(eq(users.providerUid, providerUid))
        .orderBy(asc(memberships.createdAt))
        .limit(ORG_LIST_MAX);
      return rows as OrgSummary[];
    });
  }

  /**
   * native 모드용 — user.sub = 내부 userId 이므로 `memberships.userId` 로 직접 스코프.
   * provider 변형과 동일 계약(`OrgSummary[]`). (spec-x-native-list-orgs)
   */
  async listForUserId(userId: string): Promise<OrgSummary[]> {
    return runWithSystemTenant(this.als, async () => {
      const rows = await this.database.db
        .select({
          orgId: memberships.orgId,
          name: organizations.name,
          role: memberships.role,
          isPersonal: organizations.isPersonal,
        })
        .from(memberships)
        .innerJoin(organizations, eq(memberships.orgId, organizations.id))
        .where(eq(memberships.userId, userId))
        .orderBy(asc(memberships.createdAt))
        .limit(ORG_LIST_MAX);
      return rows as OrgSummary[];
    });
  }
}
