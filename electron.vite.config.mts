import path from "node:path"
import { defineConfig } from "electron-vite"
import VueDevTools from "vite-plugin-vue-devtools"
import vue from "@vitejs/plugin-vue"
import Unocss from "unocss/vite"
import vueJsx from "@vitejs/plugin-vue-jsx"
import Icons from "unplugin-icons/vite"
import IconsResolver from "unplugin-icons/resolver"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import { visualizer } from "rollup-plugin-visualizer"
export default defineConfig({
  main: {
    optimizeDeps: {
      exclude: ["@lancedb/lancedb"],
    },
    build: {
      rollupOptions: {
        external: ["@lancedb/lancedb"],
      },
      externalizeDeps: true,
    },
    resolve: {
      alias: [
        { find: "@main", replacement: path.resolve("src/main") },
        { find: "@preload", replacement: path.resolve("src/preload") },
        { find: "@windflow/shared", replacement: path.resolve("packages/shared/src") },
      ],
    },
  },
  preload: {
    resolve: {
      alias: [
        { find: "@main", replacement: path.resolve("src/main") },
        { find: "@preload", replacement: path.resolve("src/preload") },
        { find: "@windflow/shared", replacement: path.resolve("packages/shared/src") },
      ],
    },
    build: {
      externalizeDeps: true,
    },
  },
  renderer: {
    server: {
      host: "0.0.0.0",
      port: 9527,
      strictPort: true,
      open: false,
    },
    worker: {
      format: "es",
      rollupOptions: {
        output: {
          format: "es",
        },
      },
    },
    build: {
      sourcemap: false,
    },
    resolve: {
      alias: [
        { find: "@renderer", replacement: path.resolve("src/renderer/src") },
        { find: "@windflow/shared", replacement: path.resolve("packages/shared/src") },
        { find: "@windflow/core", replacement: path.resolve("packages/core/src") },
        { find: "@windflow/markdown", replacement: path.resolve("packages/markdown/src") },
      ],
    },
    plugins: [
      VueDevTools(),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: tag => tag.startsWith("ce-"),
          },
        },
      }),
      vueJsx(),
      Icons({}),
      Unocss(),
      AutoImport({
        imports: ["vue", "vue-router", "vue-i18n"],
        vueTemplate: true,
        dts: true,
        eslintrc: {
          enabled: true,
          filepath: "./.eslintrc-auto-import.json",
        },
        resolvers: [IconsResolver(), ElementPlusResolver()],
      }),
      Components({
        resolvers: [
          IconsResolver(),
          ElementPlusResolver({
            importStyle: "sass",
          }),
        ],
        dts: true,
        globs: ["./src/renderer/src/components/*/index.vue", "./src/components/*/index.vue"],
      }),
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@renderer/app/styles/element-plus.scss" as *;`,
        },
      },
    },
  },
})
