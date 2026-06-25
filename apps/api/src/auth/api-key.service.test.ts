import { ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiKeyService } from "./api-key.service.js";

function makePool(rows: Record<string, unknown>[] = []) {
  let callCount = 0;
  const rowSets = [rows];
  const mockQuery = vi.fn().mockImplementation(() => {
    const set = rowSets[callCount] ?? [];
    callCount++;
    return Promise.resolve({ rows: set });
  });
  // org-scoped 연산은 database.db.execute(RLS tx) 경유(spec-26-04). verifyKey 만 pool 사용.
  const mockExecute = vi.fn().mockResolvedValue({ rows });
  return { pool: { query: mockQuery }, db: { execute: mockExecute }, mockQuery, mockExecute };
}

describe("ApiKeyService", () => {
  let service: ApiKeyService;

  describe("create", () => {
    it("평문 키(sk_ 접두사) + preview + id 반환", async () => {
      const insertedRow = {
        id: "key-id-001",
        org_id: "org-001",
        name: "CI Key",
        key_hash: "hash",
        key_preview: "abcd1234",
        last_used_at: null,
        revoked_at: null,
        created_at: new Date(),
      };
      const { pool, db } = makePool([insertedRow]);
      service = new ApiKeyService({ pool, db } as never);

      const result = await service.create("user-001", "org-001", "CI Key");

      expect(result.plain).toMatch(/^sk_[0-9a-f]{64}$/);
      expect(result.preview).toBe(result.plain.slice(3, 11));
      expect(result.id).toBe("key-id-001");
      expect(result.name).toBe("CI Key");
    });
  });

  describe("list", () => {
    it("orgId 기준 취소되지 않은 키 목록 반환", async () => {
      const rows = [
        {
          id: "k1",
          org_id: "org-001",
          name: "Key 1",
          key_preview: "ab12cd34",
          created_at: new Date(),
          last_used_at: null,
          revoked_at: null,
        },
        {
          id: "k2",
          org_id: "org-001",
          name: "Key 2",
          key_preview: "ef56gh78",
          created_at: new Date(),
          last_used_at: null,
          revoked_at: null,
        },
      ];
      const { pool, db } = makePool(rows);
      service = new ApiKeyService({ pool, db } as never);

      const result = await service.list("org-001");
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("key_hash");
    });
  });

  describe("revoke", () => {
    it("id + orgId 매칭 시 취소", async () => {
      const { pool, db, mockExecute } = makePool([{ id: "k1" }]);
      service = new ApiKeyService({ pool, db } as never);

      await service.revoke("k1", "org-001");
      expect(mockExecute).toHaveBeenCalledOnce();
    });

    it("매칭 없음 → ForbiddenException", async () => {
      const { pool, db } = makePool([]);
      service = new ApiKeyService({ pool, db } as never);

      await expect(service.revoke("k-unknown", "org-001")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe("verifyKey", () => {
    it("유효 키 → ApiKeyRow 반환", async () => {
      const row = {
        id: "k1",
        org_id: "org-001",
        name: "Key 1",
        key_preview: "ab12cd34",
        created_at: new Date(),
        last_used_at: null,
        revoked_at: null,
      };
      // verifyKey: SELECT (1회) + UPDATE lastUsedAt (1회)
      let call = 0;
      const mockQuery = vi.fn().mockImplementation(() => {
        call++;
        return Promise.resolve({ rows: call === 1 ? [row] : [] });
      });
      service = new ApiKeyService({ pool: { query: mockQuery } } as never);

      const result = await service.verifyKey("sk_" + "a".repeat(64));
      expect(result).not.toBeNull();
      expect(result?.id).toBe("k1");
    });

    it("취소된 키 → null", async () => {
      const { pool } = makePool([]);
      service = new ApiKeyService({ pool } as never);

      const result = await service.verifyKey("sk_" + "b".repeat(64));
      expect(result).toBeNull();
    });

    it("형식 불일치 → null", async () => {
      const { pool } = makePool([]);
      service = new ApiKeyService({ pool } as never);

      expect(await service.verifyKey("invalid-key")).toBeNull();
      expect(await service.verifyKey("sk_tooshort")).toBeNull();
    });
  });
});
