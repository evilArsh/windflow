import { createApp } from "vue"
import App from "./index.vue"
import pinia from "@renderer/store/index"
import router from "@renderer/routes/index"
import useI18n from "./usable/useI18n"
import useSize from "./usable/useSize"
import useSvgIcon from "./usable/useSvgIcon"
import { initDB } from "@renderer/usable/useDatabase"
import "./usable/useFonts"
import "./usable/useUnocss"
import "./usable/useElement"
import "./styles/index.scss"
const app = createApp(App)
app.use(pinia)
app.use(router)
initDB()
useI18n(app)
useSize(app)
useSvgIcon(app)
app.mount("#app")
export default app
