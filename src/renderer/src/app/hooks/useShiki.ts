import { createShiki } from "@toolmain/shared"
import { App } from "vue"

const shikiInstance = createShiki()
export default async (app: App<Element>) => {
  app.use(shikiInstance)
}
