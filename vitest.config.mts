import vue from "@vitejs/plugin-vue"
import { defineConfig, mergeConfig } from "vitest/config"
import path from "node:path"
import viteConfig from "./electron.vite.config.mts"
import { playwright } from "@vitest/browser-playwright"
// npx vitest --project unit-node -t "xxx"
export default mergeConfig(
  viteConfig.renderer as any,
  defineConfig({
    plugins: [vue()],
    resolve: {
      alias: [
        { find: "@main", replacement: path.resolve("src/main") },
        { find: "@preload", replacement: path.resolve("src/preload") },
        { find: "@windflow/shared", replacement: path.resolve("packages/shared/src") },
        { find: "@windflow/core", replacement: path.resolve("packages/core/src") },
        { find: "@windflow/markdown", replacement: path.resolve("packages/markdown/src") },
        { find: "@renderer", replacement: path.resolve("src/renderer/src") },
      ],
    },
    cacheDir: path.resolve(import.meta.dirname, "node_modules/.vite"),
    test: {
      reporters: "dot",
      clearMocks: true,
      projects: [
        {
          extends: "./vitest.config.mts",
          resolve: {
            // alias: {
            //   vue: path.resolve(import.meta.dirname, "node_modules/vue/dist/vue.esm-bundler.js"),
            // },
          },
          test: {
            include: [
              "src/renderer/**/*.{test,spec}.ts",
              "packages/core/**/*.{test,spec}.ts",
              "packages/markdown/**/*.{test,spec}.ts",
            ],
            name: "unit-web",
            environment: "jsdom",
            setupFiles: ["vitest-browser-vue"],
            browser: {
              enabled: true,
              provider: playwright(),
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
            setupFiles: [path.resolve(import.meta.dirname, "src/tests/setup-node.ts")],
            include: ["src/main/**/*.{test,spec}.ts", "src/shared/**/*.{test,spec}.ts"],
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
)
