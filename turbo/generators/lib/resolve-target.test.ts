import { describe, expect, it } from "vitest";
import { resolvePackageTarget } from "./resolve-target.js";

describe("resolvePackageTarget", () => {
  it("shared: @repo/<name>, base, node", () => {
    expect(resolvePackageTarget("shared", "demo")).toEqual({
      dir: "packages/shared/demo",
      pkgName: "@repo/demo",
      tsconfigExtends: "@repo/typescript-config/base",
      vitestPreset: "node",
      isConfig: false,
    });
  });

  it("backend: @repo/backend-<name>, base, node", () => {
    expect(resolvePackageTarget("backend", "cache")).toEqual({
      dir: "packages/backend/cache",
      pkgName: "@repo/backend-cache",
      tsconfigExtends: "@repo/typescript-config/base",
      vitestPreset: "node",
      isConfig: false,
    });
  });

  it("frontend: @repo/frontend-<name>, react-app, react", () => {
    expect(resolvePackageTarget("frontend", "widgets")).toEqual({
      dir: "packages/frontend/widgets",
      pkgName: "@repo/frontend-widgets",
      tsconfigExtends: "@repo/typescript-config/react-app",
      vitestPreset: "react",
      isConfig: false,
    });
  });

  it("nestjs: @repo/nestjs-<name>, nestjs, node", () => {
    expect(resolvePackageTarget("nestjs", "cache")).toEqual({
      dir: "packages/nestjs/cache",
      pkgName: "@repo/nestjs-cache",
      tsconfigExtends: "@repo/typescript-config/nestjs",
      vitestPreset: "node",
      isConfig: false,
    });
  });

  it("config: @repo/<name>-config, dir suffix -config, isConfig", () => {
    expect(resolvePackageTarget("config", "eslint")).toEqual({
      dir: "packages/config/eslint-config",
      pkgName: "@repo/eslint-config",
      tsconfigExtends: "@repo/typescript-config/base",
      vitestPreset: "node",
      isConfig: true,
    });
  });

  it("config: 이미 -config 로 끝나면 중복 suffix 금지", () => {
    const t = resolvePackageTarget("config", "biome-config");
    expect(t.dir).toBe("packages/config/biome-config");
    expect(t.pkgName).toBe("@repo/biome-config");
  });

  it("잘못된 카테고리는 throw", () => {
    // @ts-expect-error 런타임 가드 검증
    expect(() => resolvePackageTarget("infra", "x")).toThrow(/category/i);
  });

  it("빈/유효하지 않은 이름은 throw", () => {
    expect(() => resolvePackageTarget("shared", "")).toThrow(/name/i);
    expect(() => resolvePackageTarget("shared", "Bad Name")).toThrow(/name/i);
    expect(() => resolvePackageTarget("shared", "UPPER")).toThrow(/name/i);
  });
});
