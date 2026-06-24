import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "./auth.guard.js";
import { checkRoles } from "./roles-guard.util.js";

const META = "test:roles";

function makeCtx(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeReflector(roles: string[] | undefined): Reflector {
  return { getAllAndOverride: vi.fn().mockReturnValue(roles) } as unknown as Reflector;
}

const USER: AuthenticatedUser = { sub: "u1", role: "user", orgId: "o1", orgRole: "owner" };
const pickRole = (u: AuthenticatedUser) => u.role;
const pickOrgRole = (u: AuthenticatedUser) => u.orgRole;

describe("checkRoles (shared guard logic, spec-25-02 D6)", () => {
  it("메타 없음 → fail-open(통과)", () => {
    expect(checkRoles(makeCtx(USER), makeReflector(undefined), META, pickRole, "m")).toBe(true);
  });

  it("메타 빈 배열 → 통과", () => {
    expect(checkRoles(makeCtx(USER), makeReflector([]), META, pickRole, "m")).toBe(true);
  });

  it("pick 한 role 이 요구 목록에 포함 → 통과", () => {
    expect(checkRoles(makeCtx(USER), makeReflector(["user", "admin"]), META, pickRole, "m")).toBe(
      true,
    );
  });

  it("pick 한 role 이 불일치 → Forbidden", () => {
    expect(() =>
      checkRoles(makeCtx(USER), makeReflector(["admin"]), META, pickRole, "msg"),
    ).toThrow(ForbiddenException);
  });

  it("user 부재 → Forbidden (pick 호출 안 함)", () => {
    const pick = vi.fn(pickRole);
    expect(() => checkRoles(makeCtx(undefined), makeReflector(["user"]), META, pick, "m")).toThrow(
      ForbiddenException,
    );
    expect(pick).not.toHaveBeenCalled();
  });

  it("pick 이 null 반환(orgRole null) → Forbidden", () => {
    const noOrg = { ...USER, orgRole: null } as AuthenticatedUser;
    expect(() =>
      checkRoles(makeCtx(noOrg), makeReflector(["owner"]), META, pickOrgRole, "m"),
    ).toThrow(ForbiddenException);
  });
});
