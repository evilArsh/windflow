import { App } from "vue"
import { createI18n as _createI18n } from "vue-i18n"
import en from "@renderer/i18n/locales/en.json"
import zh from "@renderer/i18n/locales/zh.json"

export const createI18n = () => {
  const i18n = _createI18n({
    legacy: false,
    locale: "zh",
    fallbackLocale: "en",
    messages: {
      en,
      zh,
    },
  })
  return {
    install: (app: App<Element>) => {
      app.use(i18n)
    },
  }
}
