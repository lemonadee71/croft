import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      croft: resolve(__dirname, "../src/index.ts"),
    },
  },
  build: {
    target: "es2022",
  },
});