import { createApp } from "vue"
import App from "./index.vue"
import pinia from "@renderer/pinia/index"
import router from "@renderer/routes/index"
import "virtual:uno.css"

import "@unocss/reset/normalize.css"
import "./styles/index.scss"
import "element-plus/theme-chalk/dark/css-vars.css"
import "element-plus/es/components/message/style/css"
import "element-plus/theme-chalk/index.css"

import "dayjs/locale/zh-cn"
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount("#app")

export default app
