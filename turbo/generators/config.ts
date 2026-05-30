import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import type { PlopTypes } from "@turbo/gen";

import {
  PACKAGE_CATEGORIES,
  type PackageCategory,
  resolvePackageTarget,
} from "./lib/resolve-target.js";
import { buildFiles } from "./lib/templates.js";

interface PackageAnswers {
  category: PackageCategory;
  name: string;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description: "새 @repo/* 패키지 스캐폴딩 (ADR-0003 / ADR-0015)",
    prompts: [
      {
        type: "list",
        name: "category",
        message: "패키지 카테고리:",
        choices: [...PACKAGE_CATEGORIES],
      },
      {
        type: "input",
        name: "name",
        message: "패키지 base 이름 (kebab-case, scope/prefix 제외):",
      },
    ],
    actions: [
      (rawAnswers, _config, plopApi): string => {
        const { category, name } = rawAnswers as PackageAnswers;
        const target = resolvePackageTarget(category, name);

        const root = plopApi?.getDestBasePath?.() ?? process.cwd();
        const files = buildFiles(target, category);

        for (const file of files) {
          const abs = path.join(root, target.dir, file.path);
          if (fs.existsSync(abs)) {
            throw new Error(`이미 존재: ${path.relative(root, abs)}`);
          }
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, file.content);
        }

        // 생성 직후 biome 포맷 적용 — JSON.stringify 의 배열 줄바꿈 등을
        // 레포 스타일로 정규화해 곧바로 lint-clean 상태가 되게 한다.
        try {
          execFileSync(
            "pnpm",
            ["exec", "biome", "check", "--write", "--no-errors-on-unmatched", target.dir],
            { cwd: root, stdio: "ignore" },
          );
        } catch {
          // 포맷 실패는 치명적 아님 — 생성 자체는 완료됨 (이후 수동 biome 가능)
        }

        const rel = files.map((f) => `  ${target.dir}/${f.path}`).join("\n");
        return `✓ ${target.pkgName} 생성 (${files.length} 파일):\n${rel}\n→ 다음: pnpm install`;
      },
    ],
  });
}
