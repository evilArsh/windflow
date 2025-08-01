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
  shortcuts: {
    "wh-full": "w-full h-full",
    "flex-center": "flex justify-center items-center",
    "flex-x-center": "flex justify-center",
    "flex-y-center": "flex items-center",
    "flex-x-start": "flex items-center justify-start",
    "flex-x-between": "flex items-center justify-between",
    "flex-x-end": "flex items-center justify-end",
  },
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
    // presetWind4(),
    presetAttributify(),
  ],
})
