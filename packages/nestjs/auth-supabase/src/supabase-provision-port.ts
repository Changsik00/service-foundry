export const SUPABASE_PROVISION_PORT = Symbol("SUPABASE_PROVISION_PORT");

export interface SupabaseProvisionPort {
  provisionFromProvider(sub: string, email: string): Promise<{ orgId: string; orgRole: string }>;
  /**
   * providerUid 가 orgId 의 멤버인지 확인 (active_org 클레임 신뢰 전 게이트, spec-26-04).
   * 멤버면 orgRole, 아니면 null → verifier 가 fail-close(orgId=null) 한다.
   */
  getOrgMembership(providerUid: string, orgId: string): Promise<{ orgRole: string } | null>;
}
