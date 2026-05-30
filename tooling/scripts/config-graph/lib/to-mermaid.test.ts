import { describe, expect, it } from "vitest";
import { type ConfigGroup, toMermaid } from "./to-mermaid.js";

const groups: ConfigGroup[] = [
  {
    name: "BaseBackendSchema",
    fields: [
      { key: "NODE_ENV", type: "enum" },
      { key: "PORT", type: "number", optional: true },
    ],
  },
  {
    name: "AppSettings",
    fields: [{ key: "DATABASE_URL", type: "string" }],
  },
];

describe("toMermaid", () => {
  it("flowchart 헤더로 시작한다", () => {
    expect(toMermaid(groups).trimStart()).toMatch(/^flowchart/);
  });

  it("각 그룹을 subgraph 로 낸다", () => {
    const out = toMermaid(groups);
    expect(out).toContain("subgraph BaseBackendSchema");
    expect(out).toContain("subgraph AppSettings");
  });

  it("필드 키와 타입을 라벨에 포함한다", () => {
    const out = toMermaid(groups);
    expect(out).toContain("NODE_ENV");
    expect(out).toContain("enum");
    expect(out).toContain("DATABASE_URL");
  });

  it("optional 필드를 표시한다", () => {
    expect(toMermaid(groups)).toMatch(/PORT.*\?|PORT.*optional/i);
  });

  it("빈 그룹 목록도 유효한 mermaid 를 낸다", () => {
    expect(toMermaid([]).trimStart()).toMatch(/^flowchart/);
  });
});
