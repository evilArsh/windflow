import { NavPage } from "@renderer/types"
import { defineStore } from "pinia"
import IMdiChatProcessing from "~icons/mdi/chat-processing"
import ICardGiftcard from "~icons/ic/round-card-giftcard"

export default defineStore("nav-data", () => {
  const { t } = useI18n()
  const defaultRoute = ref("/main/chat")
  const page = ref<NavPage[]>([
    {
      index: defaultRoute.value,
      label: t("nav.chat"),
      icon: h(IMdiChatProcessing),
    },
    {
      index: "/main/model",
      label: t("nav.modelSetting"),
      icon: h(ICardGiftcard),
    },
  ])
  return {
    page,
    defaultRoute,
  }
})
