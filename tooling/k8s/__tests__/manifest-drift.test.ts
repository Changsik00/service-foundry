/**
 * k8s api 매니페스트 ↔ apps/api/service.yaml(SoT) 드리프트 검증.
 *
 * apps/api/service.yaml 의 port/name 이 SoT 이고(tooling:manifest 가 검증),
 * tooling/k8s/api.yaml 의 containerPort·Service targetPort·라벨이 이와 어긋나면
 * 클러스터에서 트래픽이 엉뚱한 포트로 가거나 Service 가 Pod 를 못 찾는다.
 *
 * 실행: npx vitest run tooling/k8s
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseAllDocuments } from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function loadDocs(relPath: string): Record<string, unknown>[] {
  const raw = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  return parseAllDocuments(raw)
    .map((d) => d.toJSON() as Record<string, unknown>)
    .filter((d) => d != null);
}

function pick<T = unknown>(obj: unknown, keyPath: string): T | undefined {
  return keyPath.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj) as T | undefined;
}

describe("k8s api 매니페스트 드리프트", () => {
  const serviceManifest = loadDocs("apps/api/service.yaml")[0];
  const expectedPort = Number(pick(serviceManifest, "port"));
  const expectedName = String(pick(serviceManifest, "name"));

  const k8sDocs = loadDocs("tooling/k8s/api.yaml");
  const deployment = k8sDocs.find((d) => d.kind === "Deployment");
  const service = k8sDocs.find((d) => d.kind === "Service");

  it("service.yaml SoT 가 유효(port=2026, name=api)", () => {
    expect(expectedPort).toBe(2026);
    expect(expectedName).toBe("api");
  });

  it("Deployment containerPort 가 SoT port 와 일치", () => {
    const containers = pick<unknown[]>(deployment, "spec.template.spec.containers") ?? [];
    const ports = containers.flatMap((c) =>
      (pick<{ containerPort: number }[]>(c, "ports") ?? []).map((p) => p.containerPort),
    );
    expect(ports).toContain(expectedPort);
  });

  it("Service port/targetPort 가 SoT port 와 일치", () => {
    const ports = pick<{ port: number; targetPort: number }[]>(service, "spec.ports") ?? [];
    expect(
      ports.some((p) => p.port === expectedPort && Number(p.targetPort) === expectedPort),
    ).toBe(true);
  });

  it("Deployment/Service name 라벨이 SoT name 과 정합", () => {
    const podLabels =
      pick<Record<string, string>>(deployment, "spec.template.metadata.labels") ?? {};
    const svcSelector = pick<Record<string, string>>(service, "spec.selector") ?? {};
    expect(Object.values(podLabels)).toContain(expectedName);
    expect(Object.values(svcSelector)).toContain(expectedName);
  });
});
