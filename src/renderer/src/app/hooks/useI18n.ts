import { App } from "vue"
import { createI18n } from "vue-i18n"
import en from "@renderer/i18n/locales/en.json"
import zh from "@renderer/i18n/locales/zh.json"

export const useI18n = async (app: App<Element>) => {
  const i18n = createI18n({
    legacy: false,
    locale: "zh",
    fallbackLocale: "en",
    messages: {
      en,
      zh,
    },
  })
  app.use(i18n)
}
