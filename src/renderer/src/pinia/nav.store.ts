import { NavPage } from "@renderer/types"
import { defineStore } from "pinia"
import useIconStore from "@renderer/pinia/icon.store"
import useI18nWatcher from "@renderer/usable/useI18nWatcher"

import IMdiChatProcessing from "~icons/mdi/chat-processing"
import ICardGiftcard from "~icons/ic/round-card-giftcard"
/**
 * 侧边菜单数据
 */
export default defineStore("nav-data", () => {
  const { t } = useI18n()
  const iconStore = useIconStore()
  const defaultRoute = ref("/main/chat")
  const page = ref<NavPage[]>([])

  iconStore.setIcon("i-mdi:chat-processing", h(IMdiChatProcessing))
  iconStore.setIcon("i-ic:round-card-giftcard", h(ICardGiftcard))

  function updatePage() {
    page.value = [
      {
        index: "/main/chat",
        label: t("nav.chat"),
        icon: "i-mdi:chat-processing",
      },
      {
        index: "/main/model",
        label: t("nav.modelSetting"),
        icon: "i-ic:round-card-giftcard",
      },
    ]
  }

  useI18nWatcher(updatePage)
  return {
    page,
    defaultRoute,
  }
})
