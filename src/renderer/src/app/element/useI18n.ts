import { App } from "vue"
import { createI18n } from "vue-i18n"

export default async (app: App<Element>) => {
  const messages = {
    en: (await import("@renderer/i18n/locales/en.json")).default,
    zh: (await import("@renderer/i18n/locales/zh.json")).default,
  }
  const i18n = createI18n({
    locale: "zh",
    fallbackLocale: "en",
    messages,
  })
  app.use(i18n)
}
