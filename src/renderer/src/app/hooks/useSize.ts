import { App } from "vue"

export const useSize = async (app: App<Element>) => {
  const setRootFontSize = () => {
    const w = window.innerWidth
    let fontSize: number
    const pcBaseWidth = 2560
    const minFontSize = 10
    const maxFontSize = 20
    if (w <= 750) {
      fontSize = minFontSize
    } else if (w > 750 && w <= pcBaseWidth) {
      // TODO
      fontSize = minFontSize
    } else {
      const scale = w / pcBaseWidth
      fontSize = scale * minFontSize
      fontSize = Math.max(minFontSize, Math.min(fontSize, maxFontSize))
    }
    document.documentElement.style.fontSize = `${fontSize}px`
  }
  setRootFontSize()

  window.addEventListener("resize", setRootFontSize)

  app.onUnmount(() => {
    window.removeEventListener("resize", setRootFontSize)
  })
}
