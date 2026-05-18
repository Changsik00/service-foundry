import { describe, expect, it } from "vitest";
import { z } from "zod";
import { paginatedResponse } from "./pagination.js";

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
