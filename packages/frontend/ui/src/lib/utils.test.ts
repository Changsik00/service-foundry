import { describe, expect, it } from "vitest";

import { cn } from "./utils.js";

describe("cn (clsx + tailwind-merge)", () => {
  it("문자열 병합", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("조건부 class — falsy 무시", () => {
    expect(cn("px-2", false && "py-1", undefined, "text-sm")).toBe("px-2 text-sm");
  });

  it("tailwind 중복 해소 — 뒤에 박힌 게 우선", () => {
    expect(cn("px-2 px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("array / object 인자 — clsx 동작", () => {
    expect(cn(["px-2", { "py-1": true, "py-2": false }])).toBe("px-2 py-1");
  });
});
