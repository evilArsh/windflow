import { createShiki as _createShiki, useShiki } from "@toolmain/shared"
import { App } from "vue"

const createShiki = () => {
  const shikiInstance = _createShiki()
  return {
    install: (app: App<Element>) => {
      app.use(shikiInstance)
    },
  }
}
export { createShiki, useShiki }
