export const FIREBASE_PROVISION_PORT = Symbol("FIREBASE_PROVISION_PORT");

export interface FirebaseProvisionPort {
  /** Firebase UID는 UUID가 아니므로 내부 UUID(`internalUserId`)를 반환 — AuthGuard sub로 교체됨. */
  provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }>;
}
