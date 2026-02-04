import { ChatListDisplayStyle, ChatPanelWidthStyle, SettingKeys } from "@windflow/core/types"
import useSettingsStore from "@renderer/store/settings"
import { toNumber } from "@toolmain/shared"

export function useChatListDisplayStyle() {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()
  const chatListDisplayList = computed(() => {
    return [
      { label: t("chat.settings.listDisplayMode.chat"), value: ChatListDisplayStyle.Chat },
      { label: t("chat.settings.listDisplayMode.list"), value: ChatListDisplayStyle.List },
    ]
  })
  const { data: chatListDisplay } = settingsStore.dataWatcher<ChatListDisplayStyle>(
    SettingKeys.ChatListDisplayStyle,
    null,
    chatListDisplayList.value[0].value
  )
  return { chatListDisplay, chatListDisplayList }
}
export function useChatPanelWidth() {
  const { t } = useI18n()
  const chatPanelType = ref(ChatPanelWidthStyle.Auto)
  const width = ref(100)
  const settingsStore = useSettingsStore()
  const { data } = settingsStore.dataWatcher<string>(SettingKeys.ChatPanelWidth, null, "100%")
  const chatPanelWidthList = computed(() => {
    return [
      { label: t("chat.settings.chatPanelAuto"), value: ChatPanelWidthStyle.Auto },
      { label: t("chat.settings.chatPanelCustom"), value: ChatPanelWidthStyle.Custom },
    ]
  })
  function onChatPanelTypeChange(val: ChatPanelWidthStyle) {
    chatPanelType.value = val
    if (val === ChatPanelWidthStyle.Auto) {
      width.value = 100
    }
  }
  watch(width, v => {
    data.value = `${v}%`
  })
  onMounted(() => {
    width.value = toNumber(data.value)
    chatPanelType.value = data.value === "100%" ? ChatPanelWidthStyle.Auto : ChatPanelWidthStyle.Custom
  })
  return {
    width,
    chatPanelType,
    chatPanelWidthList,
    onChatPanelTypeChange,
  }
}
