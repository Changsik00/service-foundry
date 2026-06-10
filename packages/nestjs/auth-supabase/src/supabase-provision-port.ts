export const SUPABASE_PROVISION_PORT = Symbol("SUPABASE_PROVISION_PORT");

export interface SupabaseProvisionPort {
  provisionFromProvider(sub: string, email: string): Promise<{ orgId: string; orgRole: string }>;
}
