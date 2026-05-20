import { reactPreset } from "@repo/vitest-config/react";
import { mergeConfig } from "vitest/config";

export default mergeConfig(reactPreset, {
  test: {
    setupFiles: ["./vitest.setup.ts"],
  },
});
