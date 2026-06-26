export const SUPABASE_PROVISION_PORT = Symbol("SUPABASE_PROVISION_PORT");

export interface SupabaseProvisionPort {
  /** providerUid → 내부 user 프로비저닝. internalUserId 로 verifier 가 sub 를 내부 id 로 정규화(spec-x-auth-sub-normalize). */
  provisionFromProvider(
    sub: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }>;
  /**
   * providerUid 가 orgId 의 멤버인지 확인 (active_org 클레임 신뢰 전 게이트, spec-26-04).
   * 멤버면 {orgRole, internalUserId}, 아니면 null → verifier 가 fail-close(orgId=null) 한다.
   */
  getOrgMembership(
    providerUid: string,
    orgId: string,
  ): Promise<{ orgRole: string; internalUserId: string } | null>;
  /** providerUid → 내부 users.id (순수 조회, 비멤버/무-org 경로 sub 정규화용). 미존재 시 null. */
  resolveInternalUserId(providerUid: string): Promise<string | null>;
}
