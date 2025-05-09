import { createShiki } from "@renderer/usable/useShiki"
import { App } from "vue"

const shikiInstance = createShiki()
export default async (app: App<Element>) => {
  app.use(shikiInstance)
}
