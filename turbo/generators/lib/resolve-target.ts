/**
 * 패키지 카테고리 → 생성 타깃 매핑 (ADR-0003 / ADR-0015).
 *
 * turbo gen 의 package 생성기가 쓰는 순수 함수. 디렉토리 위치·`@repo/*` 네이밍·
 * tsconfig extends 프리셋·vitest preset 규칙을 단일 진실로 캡슐화한다.
 */

export type PackageCategory = "shared" | "backend" | "frontend" | "nestjs" | "config";

export const PACKAGE_CATEGORIES: readonly PackageCategory[] = [
  "shared",
  "backend",
  "frontend",
  "nestjs",
  "config",
];

export interface PackageTarget {
  /** repo 루트 기준 디렉토리 (예: packages/shared/demo) */
  dir: string;
  /** package.json name (예: @repo/backend-cache) */
  pkgName: string;
  /** tsconfig extends 프리셋 */
  tsconfigExtends: string;
  /** vitest preset */
  vitestPreset: "node" | "react";
  /** config 카테고리 여부 (dir/name 에 -config suffix) */
  isConfig: boolean;
}

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TS_BASE = "@repo/typescript-config/base";
const TS_REACT = "@repo/typescript-config/react-app";
const TS_NESTJS = "@repo/typescript-config/nestjs";

export function resolvePackageTarget(category: PackageCategory, name: string): PackageTarget {
  if (!PACKAGE_CATEGORIES.includes(category)) {
    throw new Error(`unknown category: ${category} (allowed: ${PACKAGE_CATEGORIES.join(", ")})`);
  }
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`invalid name: "${name}" — kebab-case 소문자만 허용 (예: my-pkg)`);
  }

  switch (category) {
    case "shared":
      return {
        dir: `packages/shared/${name}`,
        pkgName: `@repo/${name}`,
        tsconfigExtends: TS_BASE,
        vitestPreset: "node",
        isConfig: false,
      };
    case "backend":
      return {
        dir: `packages/backend/${name}`,
        pkgName: `@repo/backend-${name}`,
        tsconfigExtends: TS_BASE,
        vitestPreset: "node",
        isConfig: false,
      };
    case "frontend":
      return {
        dir: `packages/frontend/${name}`,
        pkgName: `@repo/frontend-${name}`,
        tsconfigExtends: TS_REACT,
        vitestPreset: "react",
        isConfig: false,
      };
    case "nestjs":
      return {
        dir: `packages/nestjs/${name}`,
        pkgName: `@repo/nestjs-${name}`,
        tsconfigExtends: TS_NESTJS,
        vitestPreset: "node",
        isConfig: false,
      };
    case "config": {
      // 이미 -config 로 끝나면 중복 suffix 방지
      const base = name.endsWith("-config") ? name.slice(0, -"-config".length) : name;
      const dirName = `${base}-config`;
      return {
        dir: `packages/config/${dirName}`,
        pkgName: `@repo/${dirName}`,
        tsconfigExtends: TS_BASE,
        vitestPreset: "node",
        isConfig: true,
      };
    }
  }
}
