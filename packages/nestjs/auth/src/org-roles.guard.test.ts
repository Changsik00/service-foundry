import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";

import type { AuthenticatedUser } from "./auth.guard.js";
import { ORG_ROLES_KEY, OrgRolesGuard } from "./org-roles.guard.js";

function makeCtx(user?: AuthenticatedUser, handlerRoles?: string[], classRoles?: string[]) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({ _roles: handlerRoles }),
    getClass: () => ({ _roles: classRoles }),
  };
}

function makeReflector(roles: string[] | undefined): Reflector {
  return {
    getAllAndOverride: (_key: unknown, targets: unknown[]) => {
      const handler = (targets[0] as { _roles?: string[] })?._roles;
      const cls = (targets[1] as { _roles?: string[] })?._roles;
      return handler ?? cls ?? roles;
    },
  } as unknown as Reflector;
}

describe("OrgRolesGuard", () => {
  it("@OrgRoles 메타데이터 없음 → 통과", () => {
    const guard = new OrgRolesGuard(makeReflector(undefined));
    const ctx = makeCtx({ sub: "u1", role: "user", orgId: "org-1", orgRole: "member" });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it("orgRole 일치 (owner) → 통과", () => {
    const guard = new OrgRolesGuard(makeReflector(["admin", "owner"]));
    const ctx = makeCtx({ sub: "u1", role: "user", orgId: "org-1", orgRole: "owner" });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it("orgRole 일치 (admin) → 통과", () => {
    const guard = new OrgRolesGuard(makeReflector(["admin", "owner"]));
    const ctx = makeCtx({ sub: "u1", role: "user", orgId: "org-1", orgRole: "admin" });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it("orgRole 불일치 (member) → ForbiddenException", () => {
    const guard = new OrgRolesGuard(makeReflector(["admin", "owner"]));
    const ctx = makeCtx({ sub: "u1", role: "user", orgId: "org-1", orgRole: "member" });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it("orgRole null → ForbiddenException", () => {
    const guard = new OrgRolesGuard(makeReflector(["admin", "owner"]));
    const ctx = makeCtx({ sub: "u1", role: "user", orgId: null, orgRole: null });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it("user 없음 (AuthGuard 미적용) → ForbiddenException", () => {
    const guard = new OrgRolesGuard(makeReflector(["owner"]));
    const ctx = makeCtx(undefined);
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it("ORG_ROLES_KEY 상수 export 확인", () => {
    expect(typeof ORG_ROLES_KEY).toBe("string");
  });
});
