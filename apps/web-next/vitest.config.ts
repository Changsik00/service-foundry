import { reactPreset } from "@repo/vitest-config/react";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vitest/config";

export default mergeConfig(reactPreset, {
  plugins: [react()],
  test: {
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
});
