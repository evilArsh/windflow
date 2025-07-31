import {
  presetAttributify,
  presetIcons,
  defineConfig,
  presetWebFonts,
  presetWind3,
  presetWind4,
  presetTypography,
} from "unocss"
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
    presetWind4(),
    presetAttributify(),
  ],
})
