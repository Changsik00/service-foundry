import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest globals: false 모드 — testing-library 자동 cleanup 안 박힘. 명시 호출.
afterEach(() => {
  cleanup();
});
