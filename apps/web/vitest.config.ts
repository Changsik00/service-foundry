import { resolve } from "node:path";
import { reactPreset } from "@repo/vitest-config/react";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vitest/config";

export default mergeConfig(reactPreset, {
  plugins: [react()],
  resolve: {
    // tsconfig paths(@/*) 와 동일 — vitest 는 vite alias 로 별도 선언 필요
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
});
