import { createApp } from "vue"
import App from "./index.vue"
import pinia from "@renderer/pinia/index"
import router from "@renderer/routes/index"
import "./useUnocss"
import "./useElement"
import useI18n from "./useI18n"

import "./styles/index.scss"

const app = createApp(App)
app.use(pinia)
app.use(router)
useI18n(app)

app.mount("#app")
export default app
