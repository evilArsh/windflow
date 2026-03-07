import { defineConfig } from "vite"
export default defineConfig({
  base: "./",
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "[name].js",
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "windaiMarkdown",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["vue"],
    },
  },
})
