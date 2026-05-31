import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "./index.js";

const enc = new TextEncoder();

describe("createMemoryStorage", () => {
  it("put → get round-trip (바이트 동일)", async () => {
    const s = createMemoryStorage();
    const bytes = enc.encode("hello");
    await s.put("a.txt", bytes);
    expect(await s.get("a.txt")).toEqual(bytes);
  });

  it("문자열 put 은 UTF-8 인코딩되어 저장된다", async () => {
    const s = createMemoryStorage();
    await s.put("k", "한글");
    expect(await s.get("k")).toEqual(enc.encode("한글"));
  });

  it("미존재 key get 은 null", async () => {
    const s = createMemoryStorage();
    expect(await s.get("missing")).toBeNull();
  });

  it("del 후 get 은 null, exists 는 false", async () => {
    const s = createMemoryStorage();
    await s.put("k", "v");
    await s.del("k");
    expect(await s.get("k")).toBeNull();
    expect(await s.exists("k")).toBe(false);
  });

  it("exists 는 put 후 true", async () => {
    const s = createMemoryStorage();
    await s.put("k", "v");
    expect(await s.exists("k")).toBe(true);
  });

  it("미존재 del 은 에러 없음", async () => {
    const s = createMemoryStorage();
    await expect(s.del("nope")).resolves.toBeUndefined();
  });

  it("url 은 baseUrl/key 형식 (기본 memory://)", () => {
    expect(createMemoryStorage().url("a/b.txt")).toBe("memory://a/b.txt");
    expect(createMemoryStorage({ baseUrl: "https://cdn.test" }).url("k")).toBe(
      "https://cdn.test/k",
    );
  });
});
