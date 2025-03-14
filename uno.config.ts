import { presetAttributify, presetIcons, defineConfig } from "unocss"
import presetWind3 from "@unocss/preset-wind3"
export default defineConfig({
  shortcuts: [],
  theme: {
    colors: {},
  },
  presets: [presetWind3(), presetAttributify(), presetIcons()],
})
