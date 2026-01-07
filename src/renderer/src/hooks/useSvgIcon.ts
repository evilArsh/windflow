import { App, InjectionKey } from "vue"
import { parseSVGContent, convertParsedSVG } from "@iconify/utils"
import { IconifyJSON } from "@iconify/types"

const nameWithoutExt = (path: string) => {
  const fileName = path.split("/").pop()
  return (fileName?.split(".").slice(0, -1).join(".") ?? "").toLocaleLowerCase()
}

export const ProviderSvgIconKey: InjectionKey<IconifyJSON> = Symbol("providerSvgIcon")

export const createSvgIcon = () => {
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
  return {
    install: (app: App<Element>) => {
      app.provide(ProviderSvgIconKey, providerSvgIcon)
    },
  }
}

export function useSvgIcon() {
  const instance = inject(ProviderSvgIconKey)
  if (!instance) {
    throw new Error("useSvgIcon() is called outside of setup()")
  }
  return {
    providerSvgIcon: instance,
  }
}
