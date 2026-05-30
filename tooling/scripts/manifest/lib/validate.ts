/**
 * service.yaml 매니페스트 검증 (순수 함수).
 *
 * 각 항목을 zod 스키마로 검증 + 교차 검증(name/port 중복, depends 참조 실재).
 * 반환: 에러 배열 (빈 배열 = 유효).
 */

import { z } from "zod";

export const ServiceManifestSchema = z.object({
  name: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  expose: z.boolean().optional(),
  depends: z.array(z.string().min(1)).optional(),
});

export type ServiceManifest = z.infer<typeof ServiceManifestSchema>;

export interface ManifestError {
  service?: string;
  message: string;
}

export function validateManifests(input: unknown[]): ManifestError[] {
  const errors: ManifestError[] = [];
  const valid: ServiceManifest[] = [];

  // 1) 항목별 스키마 검증
  input.forEach((raw, i) => {
    const parsed = ServiceManifestSchema.safeParse(raw);
    if (!parsed.success) {
      const label =
        raw && typeof raw === "object" && "name" in raw
          ? String((raw as { name: unknown }).name)
          : `#${i}`;
      for (const issue of parsed.error.issues) {
        errors.push({
          service: label,
          message: `스키마 위반 [${issue.path.join(".") || "?"}]: ${issue.message}`,
        });
      }
      return;
    }
    valid.push(parsed.data);
  });

  // 2) name 중복
  const nameSeen = new Map<string, number>();
  for (const m of valid) {
    nameSeen.set(m.name, (nameSeen.get(m.name) ?? 0) + 1);
  }
  for (const [name, count] of nameSeen) {
    if (count > 1) {
      errors.push({ service: name, message: `name 중복: ${name} (${count}회)` });
    }
  }

  // 3) port 중복
  const portSeen = new Map<number, string[]>();
  for (const m of valid) {
    portSeen.set(m.port, [...(portSeen.get(m.port) ?? []), m.name]);
  }
  for (const [port, owners] of portSeen) {
    if (owners.length > 1) {
      errors.push({
        message: `port 중복: ${port} → ${owners.join(", ")}`,
      });
    }
  }

  // 4) depends 참조 실재
  const names = new Set(valid.map((m) => m.name));
  for (const m of valid) {
    for (const dep of m.depends ?? []) {
      if (!names.has(dep)) {
        errors.push({
          service: m.name,
          message: `depends 참조 미존재: ${m.name} → ${dep}`,
        });
      }
    }
  }

  return errors;
}
