import { resolve } from "node:path"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vitest/config"
import path from "node:path"
// npx vitest --project unit-node -t "xxx"
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: "@main", replacement: path.resolve("src/main") },
      { find: "@preload", replacement: path.resolve("src/preload") },
      { find: "@shared", replacement: path.resolve("src/shared") },
      { find: "@renderer", replacement: path.resolve("src/renderer/src") },
    ],
  },
  cacheDir: resolve(import.meta.dirname, "node_modules/.vite"),
  test: {
    reporters: "dot",
    clearMocks: true,
    projects: [
      {
        extends: true,
        resolve: {
          alias: {
            vue: "vue/dist/vue.esm-bundler.js",
          },
        },
        test: {
          include: ["src/renderer/**/*.{test,spec}.ts"],
          name: "unit-web",
          environment: "jsdom",
          setupFiles: ["vitest-browser-vue"],
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            instances: [{ browser: "chromium" }, { browser: "webkit" }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: "unit-node",
          environment: "node",
          setupFiles: [resolve(import.meta.dirname, "src/.test/setup.ts")],
          include: ["src/main/**/*.{test,spec}.ts"],
          server: {
            deps: {
              inline: ["vue", "msw"],
            },
          },
        },
      },
    ],
  },
})
