import { nodePreset } from "@repo/vitest-config/node";
import { mergeConfig } from "vitest/config";

export default mergeConfig(nodePreset, {});
