import { describe, expect, it } from "vitest";
import { validateManifests } from "./validate.js";

const ok = [
  { name: "api", port: 2026, expose: true, depends: ["postgres"] },
  { name: "web", port: 2027, expose: true, depends: ["api"] },
  { name: "postgres", port: 5432, expose: false },
];

describe("validateManifests", () => {
  it("정상 매니페스트는 에러 없음", () => {
    expect(validateManifests(ok)).toEqual([]);
  });

  it("포트 중복은 에러", () => {
    const errs = validateManifests([
      { name: "a", port: 3000 },
      { name: "b", port: 3000 },
    ]);
    expect(errs.length).toBeGreaterThan(0);
    expect(errs.some((e) => /port|포트|3000/i.test(e.message))).toBe(true);
  });

  it("depends 가 실재하지 않는 서비스를 참조하면 에러", () => {
    const errs = validateManifests([{ name: "a", port: 3000, depends: ["ghost"] }]);
    expect(errs.some((e) => /ghost|depends|참조/i.test(e.message))).toBe(true);
  });

  it("스키마 위반(포트 누락/범위 밖)은 에러", () => {
    expect(validateManifests([{ name: "a" }]).length).toBeGreaterThan(0);
    expect(validateManifests([{ name: "a", port: 99999 }]).length).toBeGreaterThan(0);
    expect(validateManifests([{ name: "", port: 3000 }]).length).toBeGreaterThan(0);
  });

  it("name 중복은 에러", () => {
    const errs = validateManifests([
      { name: "dup", port: 3000 },
      { name: "dup", port: 3001 },
    ]);
    expect(errs.some((e) => /name|중복|dup/i.test(e.message))).toBe(true);
  });
});
