import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";

import type { AuthenticatedUser } from "./auth.guard.js";
import { ROLES_KEY, RolesGuard } from "./roles.guard.js";

function makeCtx(user?: AuthenticatedUser, handlerRoles?: string[], classRoles?: string[]) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
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

describe("RolesGuard", () => {
  it("@Roles 메타데이터 없음 → 통과", () => {
    const guard = new RolesGuard(makeReflector(undefined));
    const ctx = makeCtx({ sub: "u1", role: "user", orgId: null });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it("user.role 일치 → 통과", () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    const ctx = makeCtx({ sub: "u1", role: "admin", orgId: null });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it("user.role 불일치 → ForbiddenException", () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    const ctx = makeCtx({ sub: "u1", role: "user", orgId: null });
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it("user 없음 (AuthGuard 미적용) → ForbiddenException", () => {
    const guard = new RolesGuard(makeReflector(["user"]));
    const ctx = makeCtx(undefined);
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it("ROLES_KEY 상수 export 확인", () => {
    expect(typeof ROLES_KEY).toBe("string");
  });
});
