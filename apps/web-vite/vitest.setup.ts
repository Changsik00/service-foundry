import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// test 환경 — Vite 의 import.meta.env stub
vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");

afterEach(() => {
  cleanup();
});
