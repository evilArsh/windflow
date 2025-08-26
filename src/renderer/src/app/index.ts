import { createApp } from "vue"
import App from "./index.vue"
import pinia from "@renderer/store/index"
import router from "@renderer/routes/index"
import useI18n from "./hooks/useI18n"
import useSize from "./hooks/useSize"
import useSvgIcon from "./hooks/useSvgIcon"
import useShiki from "./hooks/useShiki"
import "./hooks/useFonts"
import "./hooks/useUnocss"
import "./hooks/useElement"
import "./styles/index.scss"
import "./styles/vars.global.scss"
const app = createApp(App)
app.use(pinia)
app.use(router)
useShiki(app)
useI18n(app)
useSize(app)
useSvgIcon(app)
app.mount("#app")
export default app
