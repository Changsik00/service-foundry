/**
 * config 스키마 그룹 → mermaid flowchart 문자열 (순수 함수).
 *
 * 각 스키마(그룹)를 subgraph 로, 필드를 노드로 낸다.
 */

export interface ConfigField {
  key: string;
  type: string;
  optional?: boolean;
}

export interface ConfigGroup {
  name: string;
  fields: ConfigField[];
}

const sanitize = (s: string): string => s.replace(/[^A-Za-z0-9_]/g, "_");

export function toMermaid(groups: ConfigGroup[]): string {
  const lines: string[] = ["flowchart TD"];

  groups.forEach((group, gi) => {
    lines.push(`  subgraph ${sanitize(group.name)}`);
    for (const field of group.fields) {
      const id = `n${gi}_${sanitize(field.key)}`;
      const opt = field.optional ? " ?" : "";
      lines.push(`    ${id}["${field.key}: ${field.type}${opt}"]`);
    }
    lines.push("  end");
  });

  return `${lines.join("\n")}\n`;
}
