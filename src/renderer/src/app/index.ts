import { createApp } from "vue"
import App from "./index.vue"
import pinia from "@renderer/store/index"
import router from "@renderer/routes/index"
import { useI18n } from "./hooks/useI18n"
import { useSvgIcon } from "./hooks/useSvgIcon"
import { useShiki } from "./hooks/useShiki"
import { useSize } from "./hooks/useSize"
import { useMessage } from "./hooks/useMessage"
import "./modules/fonts"
import "./modules/unocss"
import "./modules/element"
import "./styles/index.scss"
import "./styles/vars.global.scss"
const app = createApp(App)
app.use(pinia)
app.use(router)
useShiki(app)
useI18n(app)
useSize(app)
useSvgIcon(app)
useMessage(app)
app.mount("#app")
export default app
