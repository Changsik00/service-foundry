import type { OrgRole } from "@repo/auth-contracts";

export function canInviteMember(_orgRole: OrgRole | null): boolean {
  throw new Error("not implemented");
}

export function canManageOrg(_orgRole: OrgRole | null): boolean {
  throw new Error("not implemented");
}
