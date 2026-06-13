import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyController } from "./api-key.controller.js";
import type { ApiKeyCreated, ApiKeyPublic } from "./api-key.service.js";

const owner: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

const fakeCreated: ApiKeyCreated = {
  id: "key-001",
  orgId: "org-001",
  name: "CI Key",
  keyPreview: "abcd1234",
  plain: "sk_" + "a".repeat(64),
  preview: "abcd1234",
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date(),
};

const fakeList: ApiKeyPublic[] = [
  {
    id: "key-001",
    orgId: "org-001",
    name: "CI Key",
    keyPreview: "abcd1234",
    lastUsedAt: null,
    revokedAt: null,
    createdAt: new Date(),
  },
];

function makeService() {
  return {
    create: vi.fn().mockResolvedValue(fakeCreated),
    list: vi.fn().mockResolvedValue(fakeList),
    revoke: vi.fn().mockResolvedValue(undefined),
    verifyKey: vi.fn().mockResolvedValue(fakeList[0]),
  };
}

describe("ApiKeyController", () => {
  let service: ReturnType<typeof makeService>;
  let controller: ApiKeyController;

  beforeEach(() => {
    service = makeService();
    controller = new ApiKeyController(service as never);
  });

  it("create → service.create(userId, orgId, name) 호출", async () => {
    const result = await controller.create(owner, { name: "CI Key" });
    expect(service.create).toHaveBeenCalledWith("user-001", "org-001", "CI Key");
    expect(result.plain).toMatch(/^sk_/);
  });

  it("list → service.list(orgId) 호출", async () => {
    const result = await controller.list(owner);
    expect(service.list).toHaveBeenCalledWith("org-001");
    expect(result).toHaveLength(1);
  });

  it("revoke → service.revoke(id, orgId) 호출", async () => {
    await controller.revoke(owner, "key-001");
    expect(service.revoke).toHaveBeenCalledWith("key-001", "org-001");
  });

  it("verify → { ok: true } 반환 (ApiKeyGuard 통과 후)", async () => {
    const result = await controller.verify();
    expect(result).toEqual({ ok: true });
  });
});
