import { presetAttributify, presetIcons, defineConfig, presetWebFonts, presetTypography } from "unocss"
import presetWind3 from "@unocss/preset-wind3"
export default defineConfig({
  shortcuts: [],
  theme: {
    colors: {},
  },
  presets: [
    presetIcons({
      extraProperties: {
        display: "inline-block",
        width: "1em",
        height: "1em",
      },
    }),
    presetWebFonts(),
    presetTypography(),
    presetWind3(),
    presetAttributify(),
  ],
})
