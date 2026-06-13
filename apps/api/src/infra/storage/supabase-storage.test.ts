import { describe, expect, it, vi } from "vitest";
import { createSupabaseStorage } from "./supabase-storage.js";

const PUBLIC_BASE_URL = "https://proj.supabase.co";
const BUCKET = "avatars";

function makeMockClient() {
  const upload = vi.fn().mockResolvedValue({ data: { path: "" }, error: null });
  const download = vi.fn().mockResolvedValue({ data: new Blob(["data"]), error: null });
  const remove = vi.fn().mockResolvedValue({ data: [], error: null });
  const list = vi.fn().mockResolvedValue({ data: [], error: null });
  const from = vi.fn().mockReturnValue({ upload, download, remove, list });
  return { storage: { from }, _mocks: { from, upload, download, remove, list } };
}

describe("createSupabaseStorage", () => {
  it("put() — Supabase upload을 upsert: true로 호출한다", async () => {
    const client = makeMockClient();
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    await storage.put("user-1", new Uint8Array([1, 2, 3]), { contentType: "image/jpeg" });

    expect(client._mocks.from).toHaveBeenCalledWith(BUCKET);
    expect(client._mocks.upload).toHaveBeenCalledWith("user-1", expect.any(Uint8Array), {
      upsert: true,
      contentType: "image/jpeg",
    });
  });

  it("put() — Supabase 에러 시 throw한다", async () => {
    const client = makeMockClient();
    client._mocks.upload.mockResolvedValue({ data: null, error: new Error("bucket not found") });
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    await expect(storage.put("key", new Uint8Array([0]))).rejects.toThrow("bucket not found");
  });

  it("get() — 존재하는 키의 Blob을 Uint8Array로 반환한다", async () => {
    const client = makeMockClient();
    client._mocks.download.mockResolvedValue({ data: new Blob(["hello"]), error: null });
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    const result = await storage.get("user-1");
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("get() — 키 없음(에러) → null 반환", async () => {
    const client = makeMockClient();
    client._mocks.download.mockResolvedValue({ data: null, error: new Error("not found") });
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    const result = await storage.get("missing");
    expect(result).toBeNull();
  });

  it("del() — remove를 배열로 호출한다", async () => {
    const client = makeMockClient();
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    await storage.del("user-1");

    expect(client._mocks.remove).toHaveBeenCalledWith(["user-1"]);
  });

  it("exists() — list 결과에 항목 있으면 true 반환", async () => {
    const client = makeMockClient();
    client._mocks.list.mockResolvedValue({ data: [{ name: "user-1" }], error: null });
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    expect(await storage.exists("user-1")).toBe(true);
  });

  it("exists() — list 결과 비어 있으면 false 반환", async () => {
    const client = makeMockClient();
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    expect(await storage.exists("missing")).toBe(false);
  });

  it("url() — public URL 형식을 반환한다", () => {
    const client = makeMockClient();
    const storage = createSupabaseStorage(client as never, BUCKET, PUBLIC_BASE_URL);

    expect(storage.url("user-1")).toBe(
      `${PUBLIC_BASE_URL}/storage/v1/object/public/${BUCKET}/user-1`,
    );
  });
});
