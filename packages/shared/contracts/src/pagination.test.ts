import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  CursorQuery,
  cursorPaginatedResponse,
  decodeCursor,
  encodeCursor,
  PaginationQuery,
  paginatedResponse,
} from "./pagination.js";

describe("paginatedResponse", () => {
  it("응답 구조(items + page + perPage + total)를 통과시킨다", () => {
    const schema = paginatedResponse(z.string());
    const result = schema.safeParse({
      items: ["a", "b", "c"],
      page: 1,
      perPage: 20,
      total: 3,
    });
    expect(result.success).toBe(true);
  });

  it("item schema 위반을 거부한다", () => {
    const schema = paginatedResponse(z.number());
    const result = schema.safeParse({
      items: [1, 2, "not a number"],
      page: 1,
      perPage: 20,
      total: 3,
    });
    expect(result.success).toBe(false);
  });

  it("음수 total을 거부한다 (min 0)", () => {
    const schema = paginatedResponse(z.string());
    const result = schema.safeParse({
      items: [],
      page: 1,
      perPage: 20,
      total: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("PaginationQuery (offset)", () => {
  it("기본값 page=1 perPage=20", () => {
    expect(PaginationQuery.parse({})).toEqual({ page: 1, perPage: 20 });
  });
  it("문자열 coerce + perPage 상한 100", () => {
    expect(PaginationQuery.parse({ page: "2", perPage: "50" })).toEqual({ page: 2, perPage: 50 });
    expect(PaginationQuery.safeParse({ perPage: 101 }).success).toBe(false);
  });
});

describe("CursorQuery", () => {
  it("기본 limit=20, cursor 옵셔널", () => {
    expect(CursorQuery.parse({})).toEqual({ limit: 20 });
    expect(CursorQuery.parse({ cursor: "abc", limit: "10" })).toEqual({ cursor: "abc", limit: 10 });
  });
});

describe("cursor codec", () => {
  it("encode→decode round-trip (유니코드 포함)", () => {
    const value = { id: 42, name: "한글", at: "2026-05-31" };
    const decoded = decodeCursor<typeof value>(encodeCursor(value));
    expect(decoded).toEqual(value);
  });
  it("encode 결과는 URL-safe 문자열", () => {
    expect(typeof encodeCursor({ a: 1 })).toBe("string");
  });
  it("잘못된 cursor 디코드는 null", () => {
    expect(decodeCursor("!!!not-base64-json")).toBeNull();
  });
});

describe("cursorPaginatedResponse", () => {
  it("items + nextCursor(nullable) 구조", () => {
    const schema = cursorPaginatedResponse(z.string());
    expect(schema.safeParse({ items: ["a"], nextCursor: "c1" }).success).toBe(true);
    expect(schema.safeParse({ items: ["a"], nextCursor: null }).success).toBe(true);
  });
  it("item schema 위반 거부", () => {
    const schema = cursorPaginatedResponse(z.number());
    expect(schema.safeParse({ items: ["x"], nextCursor: null }).success).toBe(false);
  });
});
