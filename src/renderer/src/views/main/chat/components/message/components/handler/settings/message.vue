<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import useChatStore from "@renderer/store/chat"
import { ChatTopic, SettingKeys } from "@windflow/core/types"
import { errorToText } from "@toolmain/shared"
import { msg } from "@renderer/utils"
import Group from "../components/group.vue"
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
    <ContentBox class="setting-box">
      <template #icon>
        <i-ic-outline-featured-play-list></i-ic-outline-featured-play-list>
      </template>
      <el-text size="small">{{ t("chat.settings.maxContextLength") }}</el-text>
      <template #end>
        <el-tooltip
          :teleported="false"
          popper-class="max-w-25rem"
          :content="t('chat.settings.maxContextLengthExp')"
          placement="top">
          <i-material-symbols-help-outline></i-material-symbols-help-outline>
        </el-tooltip>
      </template>
      <template #footer>
        <div class="px-1rem w-full flex items-center">
          <el-slider
            size="small"
            @change="updateTopic"
            show-input
            v-model="topic.maxContextLength"
            :min="1"
            :max="999"
            :step="1"></el-slider>
        </div>
      </template>
    </ContentBox>
    <ContentBox class="setting-box">
      <template #icon>
        <i-ic-baseline-auto-fix-high></i-ic-baseline-auto-fix-high>
      </template>
      <el-text size="small">{{ t("chat.settings.forcePlaintext") }}</el-text>
      <template #footer>
        <el-switch v-model="forcePlaintext"></el-switch>
      </template>
    </ContentBox>
  </Group>
</template>
<style lang="scss" scoped>
@use "../components/common.scss";
</style>
