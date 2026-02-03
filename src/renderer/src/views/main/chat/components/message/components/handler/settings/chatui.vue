<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { ChatListDisplayStyle, ChatTopic, SettingKeys } from "@windflow/core/types"
import Group from "../components/group.vue"
import Item from "../components/item.vue"
defineProps<{
  topic: ChatTopic
}>()
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
</script>
<template>
  <Group>
    <Item :title="t('chat.settings.ChatListDisplayStyle')" icon-class="i-ic-outline-chat-bubble-outline">
      <el-segmented class="custom-segmented" v-model="chatListDisplay" :options="chatListDisplayList" />
    </Item>
  </Group>
</template>
<style lang="scss" scoped>
.custom-segmented {
  --el-border-radius-base: var(--ai-gap-large);
}
</style>
