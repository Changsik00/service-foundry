export const FIREBASE_PROVISION_PORT = Symbol("FIREBASE_PROVISION_PORT");

export interface FirebaseProvisionPort {
  provisionFromProvider(uid: string, email: string): Promise<{ orgId: string; orgRole: string }>;
}
