import { describe, expect, it, vi } from "vitest";
import { FeatureFlagService } from "./feature-flag.service.js";

const FLAG_A = {
  id: "flag-1",
  key: "new-dashboard",
  description: "신규 대시보드",
  enabled: true,
  createdAt: new Date("2024-01-01"),
};

const FLAG_B = {
  id: "flag-2",
  key: "beta-export",
  description: null,
  enabled: false,
  createdAt: new Date("2024-01-02"),
};

function makeSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ orderBy });
  const select = vi.fn().mockReturnValue({ from });
  return { db: { select }, mocks: { select, from, orderBy, limit } };
}

function makeDb(overrides: Record<string, unknown> = {}) {
  const select = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const del = vi.fn();
  return {
    db: { select, insert, update, delete: del, ...overrides },
    mocks: { select, insert, update, del },
  };
}

describe("FeatureFlagService — list", () => {
  it("전체 플래그 반환", async () => {
    const { db } = makeSelectChain([FLAG_A, FLAG_B]);
    const service = new FeatureFlagService({ db } as never);
    const result = await service.list();
    expect(result).toEqual([FLAG_A, FLAG_B]);
  });

  it("플래그 없으면 빈 배열 반환", async () => {
    const { db } = makeSelectChain([]);
    const service = new FeatureFlagService({ db } as never);
    const result = await service.list();
    expect(result).toEqual([]);
  });

  it("상한 LIMIT 으로 무제한 스캔 방지 (A5)", async () => {
    const { db, mocks } = makeSelectChain([FLAG_A]);
    const service = new FeatureFlagService({ db } as never);
    await service.list();
    expect(mocks.limit).toHaveBeenCalled();
    const [n] = mocks.limit.mock.calls[0] as number[];
    expect(typeof n).toBe("number");
    expect(n).toBeGreaterThan(0);
  });
});

describe("FeatureFlagService — isEnabled", () => {
  function makeIsEnabledDb(rows: unknown[]) {
    const execute = vi.fn().mockResolvedValue(rows);
    const where = vi.fn().mockReturnValue({ execute });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    return { db: { select } };
  }

  it("enabled=true 플래그 → true", async () => {
    const { db } = makeIsEnabledDb([{ enabled: true }]);
    const service = new FeatureFlagService({ db } as never);
    const result = await service.isEnabled("new-dashboard");
    expect(result).toBe(true);
  });

  it("enabled=false 플래그 → false", async () => {
    const { db } = makeIsEnabledDb([{ enabled: false }]);
    const service = new FeatureFlagService({ db } as never);
    const result = await service.isEnabled("beta-export");
    expect(result).toBe(false);
  });

  it("플래그 없으면 → false", async () => {
    const { db } = makeIsEnabledDb([]);
    const service = new FeatureFlagService({ db } as never);
    const result = await service.isEnabled("nonexistent");
    expect(result).toBe(false);
  });
});

describe("FeatureFlagService — create", () => {
  it("key + description insert 후 생성된 플래그 반환", async () => {
    const created = { ...FLAG_A };
    const execute = vi.fn().mockResolvedValue([created]);
    const values = vi.fn().mockReturnValue({ returning: () => ({ execute }) });
    const insert = vi.fn().mockReturnValue({ values });
    const { db } = makeDb({ insert });
    const service = new FeatureFlagService({ db } as never);

    const result = await service.create("new-dashboard", "신규 대시보드");

    expect(insert).toHaveBeenCalled();
    expect(result).toEqual(created);
  });

  it("description 없이 key만으로 생성", async () => {
    const created = { ...FLAG_A, description: null };
    const execute = vi.fn().mockResolvedValue([created]);
    const values = vi.fn().mockReturnValue({ returning: () => ({ execute }) });
    const insert = vi.fn().mockReturnValue({ values });
    const { db } = makeDb({ insert });
    const service = new FeatureFlagService({ db } as never);

    const result = await service.create("new-dashboard");

    expect(insert).toHaveBeenCalled();
    expect(result).toEqual(created);
  });
});

describe("FeatureFlagService — update", () => {
  it("enabled 상태 변경 후 업데이트된 플래그 반환", async () => {
    const updated = { ...FLAG_B, enabled: true };
    const execute = vi.fn().mockResolvedValue([updated]);
    const where = vi.fn().mockReturnValue({ returning: () => ({ execute }) });
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    const { db } = makeDb({ update });
    const service = new FeatureFlagService({ db } as never);

    const result = await service.update("beta-export", true);

    expect(update).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });
});

describe("FeatureFlagService — remove", () => {
  it("key로 플래그 삭제", async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ execute });
    const del = vi.fn().mockReturnValue({ where });
    const { db } = makeDb({ delete: del });
    const service = new FeatureFlagService({ db } as never);

    await expect(service.remove("new-dashboard")).resolves.toBeUndefined();
    expect(del).toHaveBeenCalled();
  });
});
