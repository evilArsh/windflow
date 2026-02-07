import { createApp } from "vue"
import App from "./index.vue"
import pinia from "@renderer/store/index"
import router from "@renderer/routes/index"
import { createI18n } from "@renderer/hooks/useI18n"
import { createSvgIcon } from "@renderer/hooks/useSvgIcon"
import { createShiki } from "@renderer/hooks/useShiki"
import { createSize } from "@renderer/hooks/useSize"
import {
  createChatMessage,
  createKnowledge,
  createMCP,
  createSettings,
  createModel,
  createProvider,
} from "@renderer/hooks/useCore"
import { createMarkdownWorker } from "@windflow/markdown"
import "./modules/fonts"
import "./modules/unocss"
import "./modules/element"
import "./styles/index.scss"
import "./styles/vars.global.scss"
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(createShiki())
app.use(createI18n())
app.use(createSize())
app.use(createSvgIcon())
app.use(createChatMessage())
app.use(createKnowledge())
app.use(createMCP())
app.use(createSettings())
app.use(createModel())
app.use(createProvider())
app.use(createMarkdownWorker())
app.mount("#app")
export default app
