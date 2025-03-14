import path from "node:path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import vue from "@vitejs/plugin-vue"
import Unocss from "unocss/vite"
import vueJsx from "@vitejs/plugin-vue-jsx"
import Icons from "unplugin-icons/vite"
import IconsResolver from "unplugin-icons/resolver"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    server: {
      host: "0.0.0.0",
      port: 9527,
      strictPort: true,
      open: false,
    },
    build: {
      sourcemap: false,
    },
    resolve: {
      alias: {
        "@renderer": path.resolve("src/renderer/src"),
      },
    },
    plugins: [
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
        imports: ["vue", "vue-router"],
        vueTemplate: true,
        dts: true,
        eslintrc: {
          enabled: true,
          filepath: "./.eslintrc-auto-import.json",
        },
        dirs: ["./src/renderer/src/lib/shared"],
        resolvers: [IconsResolver(), ElementPlusResolver()],
      }),
      Components({
        resolvers: [IconsResolver(), ElementPlusResolver()],
        dts: true,
        globs: ["./src/components/*/index.vue"],
        // dirs: ["./src/components"],
        // deep: false,
        // include: ["./src/renderer/src/components/**/index.vue"],
        // exclude: ["./src/renderer/src/components/ScalePanel/**/*.vue"],
      }),
      // visualizer(),
    ],
  },
})
