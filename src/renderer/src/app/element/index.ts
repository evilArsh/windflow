import { createApp } from "vue"
import App from "./index.vue"
import pinia from "@renderer/pinia/index"
import router from "@renderer/routes/index"
import useI18n from "./usable/useI18n"
import useSize from "./usable/useSize"
import "./usable/useUnocss"
import "./usable/useElement"
import "./styles/index.scss"

const app = createApp(App)
app.use(pinia)
app.use(router)

useI18n(app)
useSize(app)

app.mount("#app")
export default app
