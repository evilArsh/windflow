import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./electron.vite.config.mts"

export default mergeConfig(
  viteConfig.renderer as any,
  defineConfig({
    test: {},
  })
)
