import type { OrgRole } from "@repo/auth-contracts";

export function canInviteMember(orgRole: OrgRole | null): boolean {
  return orgRole === "owner" || orgRole === "admin";
}

export function canManageOrg(orgRole: OrgRole | null): boolean {
  return orgRole === "owner";
}
