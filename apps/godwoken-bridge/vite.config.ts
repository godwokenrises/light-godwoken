import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), svgr()],
    build: {
      outDir: "build",
      manifest: true,
    },
    define: {
      "process.env": env,
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: "globalThis",
        },
      },
    },
    resolve: {
      alias: {
        https: "agent-base",
        // comment above line and uncomment below line if it does not work
        // http: "agent-base",
      },
    },
  };
});
