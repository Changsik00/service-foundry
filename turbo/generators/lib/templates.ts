/**
 * 생성 파일 콘텐츠 빌더 (순수 함수).
 *
 * resolvePackageTarget 의 결과 + 카테고리로 각 파일 문자열을 만든다.
 * 모든 버전은 catalog: / workspace:* 참조 (ADR-0003).
 * 콘텐츠의 정합성은 통합 스모크 테스트(생성→install→lint/typecheck/test)가 검증한다.
 */

import type { PackageCategory, PackageTarget } from "./resolve-target.js";

const pascalCase = (name: string): string =>
  name
    .split("-")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

const json = (obj: unknown): string => `${JSON.stringify(obj, null, 2)}\n`;

interface ManifestParts {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies: Record<string, string>;
}

const BASE_DEV: Record<string, string> = {
  "@biomejs/biome": "catalog:",
  "@repo/biome-config": "workspace:*",
  "@repo/typescript-config": "workspace:*",
  "@repo/vitest-config": "workspace:*",
  typescript: "catalog:",
  vitest: "catalog:",
};

const categoryParts = (category: PackageCategory): ManifestParts => {
  switch (category) {
    case "shared":
      return { devDependencies: { ...BASE_DEV } };
    case "backend":
      return {
        devDependencies: { ...BASE_DEV, "@types/node": "catalog:" },
      };
    case "nestjs":
      return {
        dependencies: {
          "@nestjs/common": "catalog:",
          "reflect-metadata": "catalog:",
        },
        devDependencies: { ...BASE_DEV, "@types/node": "catalog:" },
      };
    case "frontend":
      return {
        peerDependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
        devDependencies: {
          ...BASE_DEV,
          "@testing-library/jest-dom": "catalog:",
          "@testing-library/react": "catalog:",
          "@types/react": "catalog:",
          "@types/react-dom": "catalog:",
          "@vitejs/plugin-react": "catalog:",
          jsdom: "catalog:",
          react: "catalog:",
          "react-dom": "catalog:",
        },
      };
    case "config":
      // config 패키지는 JSON 프리셋만 — src/test 없음
      return { devDependencies: {} };
  }
};

/** package.json 콘텐츠 */
export const packageJson = (target: PackageTarget, category: PackageCategory): string => {
  if (target.isConfig) {
    return json({
      name: target.pkgName,
      version: "0.0.0",
      private: true,
      type: "module",
      files: ["base.json"],
      exports: {
        "./base": "./base.json",
        "./package.json": "./package.json",
      },
      scripts: { lint: "biome check ." },
    });
  }

  const parts = categoryParts(category);
  const manifest: Record<string, unknown> = {
    name: target.pkgName,
    version: "0.0.0",
    private: true,
    type: "module",
    exports: {
      ".": { types: "./src/index.ts", default: "./src/index.ts" },
      "./package.json": "./package.json",
    },
    files: ["src"],
    scripts: {
      lint: "biome check .",
      typecheck: "tsc --noEmit",
      test: "vitest run",
    },
  };
  if (parts.dependencies) manifest.dependencies = parts.dependencies;
  if (parts.peerDependencies) manifest.peerDependencies = parts.peerDependencies;
  manifest.devDependencies = parts.devDependencies;
  return json(manifest);
};

/** tsconfig.json 콘텐츠 (config 카테고리는 생성 안 함) */
export const tsconfig = (target: PackageTarget, category: PackageCategory): string => {
  const compilerOptions =
    category === "shared"
      ? { lib: ["ES2023", "DOM"] }
      : category === "backend"
        ? { types: ["node"] }
        : undefined;
  const include = category === "frontend" ? ["src/**/*.ts", "src/**/*.tsx"] : ["src/**/*.ts"];
  const obj: Record<string, unknown> = { extends: target.tsconfigExtends };
  if (compilerOptions) obj.compilerOptions = compilerOptions;
  obj.include = include;
  return json(obj);
};

/** vitest.config.ts 콘텐츠 */
export const vitestConfig = (target: PackageTarget): string =>
  `export { default } from "@repo/vitest-config/${target.vitestPreset}";\n`;

/** src/index.ts(x) 콘텐츠 */
export const srcIndex = (target: PackageTarget, category: PackageCategory): string => {
  if (category === "nestjs") {
    const Pascal = pascalCase(target.pkgName.replace("@repo/nestjs-", ""));
    return `import { type DynamicModule, Module } from "@nestjs/common";

export interface ${Pascal}ModuleOptions {
  // TODO: 모듈 설정 옵션
  readonly enabled?: boolean;
}

@Module({})
export class ${Pascal}Module {
  static forRoot(options: ${Pascal}ModuleOptions = {}): DynamicModule {
    return {
      module: ${Pascal}Module,
      providers: [],
      exports: [],
    };
  }
}
`;
  }
  if (category === "frontend") {
    return `export const hello = (): string => "${target.pkgName}";\n`;
  }
  return `export const hello = (): string => "${target.pkgName}";\n`;
};

/** src/index.test.ts(x) 콘텐츠 */
export const srcIndexTest = (target: PackageTarget, category: PackageCategory): string => {
  if (category === "nestjs") {
    const Pascal = pascalCase(target.pkgName.replace("@repo/nestjs-", ""));
    return `import { describe, expect, it } from "vitest";
import { ${Pascal}Module } from "./index.js";

describe("${target.pkgName}", () => {
  it("forRoot 가 DynamicModule 을 반환한다", () => {
    const mod = ${Pascal}Module.forRoot();
    expect(mod.module).toBe(${Pascal}Module);
  });
});
`;
  }
  return `import { describe, expect, it } from "vitest";
import { hello } from "./index.js";

describe("${target.pkgName}", () => {
  it("hello 가 패키지명을 반환한다", () => {
    expect(hello()).toBe("${target.pkgName}");
  });
});
`;
};

/** config 카테고리 base.json 콘텐츠 */
export const configBaseJson = (): string => json({});

/** 생성할 파일 목록 (path 상대경로 + 콘텐츠) */
export interface GeneratedFile {
  path: string; // target.dir 기준 상대경로
  content: string;
}

export const buildFiles = (target: PackageTarget, category: PackageCategory): GeneratedFile[] => {
  if (target.isConfig) {
    return [
      { path: "package.json", content: packageJson(target, category) },
      { path: "base.json", content: configBaseJson() },
    ];
  }
  const ext = category === "frontend" ? "tsx" : "ts";
  return [
    { path: "package.json", content: packageJson(target, category) },
    { path: "tsconfig.json", content: tsconfig(target, category) },
    { path: "vitest.config.ts", content: vitestConfig(target) },
    { path: `src/index.${ext}`, content: srcIndex(target, category) },
    { path: `src/index.test.${ext}`, content: srcIndexTest(target, category) },
  ];
};
