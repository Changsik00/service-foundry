/**
 * tooling:config-graph — backend/settings 의 config 스키마를 mermaid 로 출력.
 *
 *   pnpm tooling:config-graph
 *
 * 표준 출력으로 mermaid flowchart 를 낸다 (파일로 리다이렉트해 문서에 임베드 가능).
 */

import { BaseBackendSchema, introspectEnvSchema } from "@repo/backend-settings";

import { type ConfigGroup, toMermaid } from "./lib/to-mermaid.js";

function buildGroups(): ConfigGroup[] {
  const fields = introspectEnvSchema(BaseBackendSchema).map((f) => ({
    key: f.key,
    type: f.type,
    optional: !f.required,
  }));
  return [{ name: "BaseBackendSchema", fields }];
}

console.info(toMermaid(buildGroups()));
