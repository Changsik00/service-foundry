import { describe, expect, it } from "vitest";
import { resolveQueueConfig } from "./config.js";

describe("resolveQueueConfig", () => {
  it("기본값 localhost:6379", () => {
    expect(resolveQueueConfig({}).connection).toEqual({ host: "localhost", port: 6379 });
  });

  it("REDIS_HOST/REDIS_PORT 반영", () => {
    expect(resolveQueueConfig({ REDIS_HOST: "cache", REDIS_PORT: "6390" }).connection).toEqual({
      host: "cache",
      port: 6390,
    });
  });

  it("REDIS_URL 파싱 (host:port)", () => {
    expect(resolveQueueConfig({ REDIS_URL: "redis://myhost:6391" }).connection).toEqual({
      host: "myhost",
      port: 6391,
    });
  });

  it("REDIS_URL 이 host/port 보다 우선", () => {
    expect(
      resolveQueueConfig({
        REDIS_URL: "redis://urlhost:6392",
        REDIS_HOST: "ignored",
        REDIS_PORT: "1111",
      }).connection,
    ).toEqual({ host: "urlhost", port: 6392 });
  });

  it("REDIS_URL 포트 생략 시 6379", () => {
    expect(resolveQueueConfig({ REDIS_URL: "redis://onlyhost" }).connection).toEqual({
      host: "onlyhost",
      port: 6379,
    });
  });
});
