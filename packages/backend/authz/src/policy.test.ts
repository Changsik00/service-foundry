import { describe, expect, it } from "vitest";
import { canInviteMember, canManageOrg } from "./policy.js";

describe("canInviteMember", () => {
  it("owner → true", () => expect(canInviteMember("owner")).toBe(true));
  it("admin → true", () => expect(canInviteMember("admin")).toBe(true));
  it("member → false", () => expect(canInviteMember("member")).toBe(false));
  it("null → false", () => expect(canInviteMember(null)).toBe(false));
});

describe("canManageOrg", () => {
  it("owner → true", () => expect(canManageOrg("owner")).toBe(true));
  it("admin → false", () => expect(canManageOrg("admin")).toBe(false));
  it("member → false", () => expect(canManageOrg("member")).toBe(false));
  it("null → false", () => expect(canManageOrg(null)).toBe(false));
});
