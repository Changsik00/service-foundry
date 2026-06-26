export const FIREBASE_PROVISION_PORT = Symbol("FIREBASE_PROVISION_PORT");

export interface FirebaseProvisionPort {
  /** Firebase UID는 UUID가 아니므로 내부 UUID(`internalUserId`)를 반환 — AuthGuard sub로 교체됨. */
  provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }>;
  /**
   * providerUid(Firebase UID) 가 orgId 의 멤버인지 확인 (active_org 클레임 게이트, spec-26-04).
   * 멤버면 orgRole, 아니면 null → verifier 가 fail-close(orgId=null) 한다.
   */
  getOrgMembership(providerUid: string, orgId: string): Promise<{ orgRole: string } | null>;
}
