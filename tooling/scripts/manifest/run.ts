/**
 * tooling:manifest — apps 의 service.yaml 을 로드해 검증한다.
 *
 *   pnpm tooling:manifest
 *
 * 모든 매니페스트가 유효하면 exit 0, 위반이 있으면 에러 출력 후 exit 1.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

import { validateManifests } from "./lib/validate.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APPS_DIR = path.join(ROOT, "apps");

function loadManifests(): unknown[] {
  if (!fs.existsSync(APPS_DIR)) return [];
  const out: unknown[] = [];
  for (const entry of fs.readdirSync(APPS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(APPS_DIR, entry.name, "service.yaml");
    if (!fs.existsSync(file)) continue;
    out.push(parseYaml(fs.readFileSync(file, "utf8")));
  }
  return out;
}

function main(): void {
  const manifests = loadManifests();
  if (manifests.length === 0) {
    console.error("✗ service.yaml 을 찾지 못했습니다 (apps/*/service.yaml)");
    process.exit(1);
  }

  const errors = validateManifests(manifests);
  if (errors.length > 0) {
    console.error(`✗ 매니페스트 검증 실패 (${errors.length}건):`);
    for (const e of errors) {
      console.error(`  - ${e.service ? `[${e.service}] ` : ""}${e.message}`);
    }
    process.exit(1);
  }

  console.info(`✓ service manifest ${manifests.length}건 검증 통과`);
}

main();
