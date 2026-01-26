<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import useChatStore from "@renderer/store/chat"
import { ChatTopic, SettingKeys } from "@windflow/core/types"
import { errorToText } from "@toolmain/shared"
import { msg } from "@renderer/utils"
import Group from "../components/group.vue"
import Item from "../components/item.vue"
const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const topic = computed(() => props.topic)
const settingsStore = useSettingsStore()
async function updateTopic() {
  try {
    await chatStore.updateChatTopic(topic.value)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
const { data: forcePlaintext } = settingsStore.dataWatcher<boolean>(SettingKeys.ChatForcePlaintext, null, false)
</script>
<template>
  <Group>
    <Item :title="t('chat.settings.maxContextLength')" icon-class="i-ic-outline-featured-play-list">
      <el-slider
        @change="updateTopic"
        show-input
        v-model="topic.maxContextLength"
        :min="1"
        :max="999"
        :step="1"></el-slider>
      <template #end>
        <el-tooltip
          :teleported="false"
          popper-class="max-w-25rem"
          :content="t('chat.settings.maxContextLengthExp')"
          placement="top">
          <i-material-symbols-help-outline></i-material-symbols-help-outline>
        </el-tooltip>
      </template>
    </Item>
    <Item :title="t('chat.settings.forcePlaintext')" icon-class="i-ic-baseline-auto-fix-high">
      <el-switch v-model="forcePlaintext"></el-switch>
    </Item>
  </Group>
</template>
<style lang="scss" scoped></style>
