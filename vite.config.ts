import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    rollupOptions: {
      input: "src/main.ts",
      output: {
        entryFileNames: "tw2k-tactical.js"
      }
    }
  }
});
