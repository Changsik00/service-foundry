import { describe, expect, it } from "vitest";
import { APP_TYPES, resolveAppTarget } from "./resolve-app-target.js";

describe("resolveAppTarget", () => {
  it("api: @apps/<name>, nestjs tsconfig", () => {
    expect(resolveAppTarget("api", "billing", 2031)).toEqual({
      dir: "apps/billing",
      pkgName: "@apps/billing",
      type: "api",
      port: 2031,
      tsconfigExtends: "@repo/typescript-config/nestjs",
    });
  });

  it("next: @apps/<name>, react-app tsconfig", () => {
    expect(resolveAppTarget("next", "portal", 2032)).toEqual({
      dir: "apps/portal",
      pkgName: "@apps/portal",
      type: "next",
      port: 2032,
      tsconfigExtends: "@repo/typescript-config/react-app",
    });
  });

  it("vite: @apps/<name>, react-app tsconfig", () => {
    expect(resolveAppTarget("vite", "dashboard", 2033)).toEqual({
      dir: "apps/dashboard",
      pkgName: "@apps/dashboard",
      type: "vite",
      port: 2033,
      tsconfigExtends: "@repo/typescript-config/react-app",
    });
  });

  it("APP_TYPES 는 3종", () => {
    expect([...APP_TYPES]).toEqual(["api", "next", "vite"]);
  });

  it("잘못된 타입은 throw", () => {
    // @ts-expect-error 런타임 가드 검증
    expect(() => resolveAppTarget("worker", "x", 3000)).toThrow(/type/i);
  });

  it("잘못된 이름은 throw", () => {
    expect(() => resolveAppTarget("api", "", 3000)).toThrow(/name/i);
    expect(() => resolveAppTarget("api", "Bad Name", 3000)).toThrow(/name/i);
    expect(() => resolveAppTarget("api", "UPPER", 3000)).toThrow(/name/i);
  });

  it("잘못된 포트는 throw", () => {
    expect(() => resolveAppTarget("api", "ok", 0)).toThrow(/port/i);
    expect(() => resolveAppTarget("api", "ok", 99999)).toThrow(/port/i);
  });
});
