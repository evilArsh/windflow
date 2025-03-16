import { NavPage } from "@renderer/types"
import { defineStore } from "pinia"
import IMdiChatProcessing from "~icons/mdi/chat-processing"
import ICardGiftcard from "~icons/ic/round-card-giftcard"
import useI18nWatcher from "@renderer/usable/useI18nWatcher"

/**
 * 侧边菜单数据
 */
export default defineStore("nav-data", () => {
  const { t } = useI18n()
  const defaultRoute = ref("/main/chat")
  const page = ref<NavPage[]>([])

  function updatePage() {
    page.value = [
      {
        index: "/main/chat",
        label: t("nav.chat"),
        icon: h(IMdiChatProcessing),
      },
      {
        index: "/main/model",
        label: t("nav.modelSetting"),
        icon: h(ICardGiftcard),
      },
    ]
  }

  useI18nWatcher(updatePage)
  return {
    page,
    defaultRoute,
  }
})
