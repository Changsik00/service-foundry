import { describe, expect, it } from "vitest";
import { resolvePackageTarget } from "./resolve-target.js";
import { buildFiles, tsconfig } from "./templates.js";

const parse = (target: Parameters<typeof tsconfig>[0], category: Parameters<typeof tsconfig>[1]) =>
  JSON.parse(tsconfig(target, category)) as {
    extends: string;
    compilerOptions?: Record<string, unknown>;
    include: string[];
  };

describe("tsconfig 템플릿", () => {
  it("backend: compilerOptions.types = ['node']", () => {
    const ts = parse(resolvePackageTarget("backend", "cache"), "backend");
    expect(ts.extends).toBe("@repo/typescript-config/base");
    expect(ts.compilerOptions).toEqual({ types: ["node"] });
    expect(ts.include).toEqual(["src/**/*.ts"]);
  });

  it("shared: compilerOptions.lib = ['ES2023','DOM']", () => {
    const ts = parse(resolvePackageTarget("shared", "demo"), "shared");
    expect(ts.compilerOptions).toEqual({ lib: ["ES2023", "DOM"] });
    expect(ts.include).toEqual(["src/**/*.ts"]);
  });

  it("frontend: compilerOptions 없음 (react preset), tsx include", () => {
    const ts = parse(resolvePackageTarget("frontend", "widgets"), "frontend");
    expect(ts.extends).toBe("@repo/typescript-config/react-app");
    expect(ts.compilerOptions).toBeUndefined();
    expect(ts.include).toEqual(["src/**/*.ts", "src/**/*.tsx"]);
  });

  it("nestjs: compilerOptions 없음 (nestjs preset = node)", () => {
    const ts = parse(resolvePackageTarget("nestjs", "cache"), "nestjs");
    expect(ts.extends).toBe("@repo/typescript-config/nestjs");
    expect(ts.compilerOptions).toBeUndefined();
    expect(ts.include).toEqual(["src/**/*.ts"]);
  });

  it("config: tsconfig.json 을 생성하지 않는다", () => {
    const target = resolvePackageTarget("config", "eslint");
    const paths = buildFiles(target, "config").map((f) => f.path);
    expect(paths).not.toContain("tsconfig.json");
    expect(paths).toEqual(["package.json", "base.json"]);
  });
});
