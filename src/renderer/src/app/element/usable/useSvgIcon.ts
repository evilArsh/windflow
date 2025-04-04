import { App, InjectionKey } from "vue"
import { parseSVGContent, convertParsedSVG } from "@iconify/utils"
import { IconifyJSON } from "@iconify/types"

export const providerSvgIconKey = Symbol("providerSvgIcon") as InjectionKey<IconifyJSON>

const nameWithoutExt = (path: string) => {
  const fileName = path.split("/").pop()
  return fileName?.split(".").slice(0, -1).join(".") ?? ""
}
export default async (app: App<Element>) => {
  const svgIcon = import.meta.glob("/src/assets/images/provider/**/*.svg", {
    eager: true,
    query: "?raw",
    import: "default",
  })
  const providerSvgIcon: IconifyJSON = {
    prefix: "provider",
    icons: {},
  }
  Object.entries(svgIcon).forEach(([key, value]) => {
    const name = nameWithoutExt(key)
    const svg = parseSVGContent(value as string)
    if (svg) {
      const icon = convertParsedSVG(svg)
      if (icon) {
        providerSvgIcon.icons[name] = icon
      }
    }
  })
  app.provide(providerSvgIconKey, providerSvgIcon)
}
