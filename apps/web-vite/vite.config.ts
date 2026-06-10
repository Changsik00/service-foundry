import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // 루트 .env 로드 — VITE_ prefix 없는 변수도 서버(config)에서 읽기 위해 prefix: ""
  const env = loadEnv(mode, resolve(fileURLToPath(new URL(".", import.meta.url)), "../../"), "");

  return {
    plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: { port: 2028 },
    // unprefixed 루트 변수 → import.meta.env.VITE_* 매핑
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(env.API_BASE_URL ?? ""),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.SUPABASE_URL ?? ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.SUPABASE_PUBLISHABLE_KEY ?? "",
      ),
    },
  };
});
