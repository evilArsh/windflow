<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import useChatStore from "@renderer/store/chat"
import { ChatTopic, SettingKeys } from "@renderer/types"
import { errorToText, msg } from "@toolmain/shared"
const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const topic = computed(() => props.topic)
const sendShortcut = ref("")
const settingsStore = useSettingsStore()
settingsStore.api.dataWatcher<string>(SettingKeys.ChatSendShortcut, sendShortcut, "enter")
async function updateTopic() {
  try {
    await chatStore.api.putChatTopic(topic.value)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
</script>
<template>
  <div class="flex flex-col w-full">
    <el-divider class="my-.25rem!"></el-divider>
    <ContentBox>
      <el-text>{{ t("chat.settings.maxContextLength") }}</el-text>
      <template #end>
        <el-tooltip
          :teleported="false"
          popper-class="max-w-25rem"
          :content="t('chat.settings.maxContextLengthExp')"
          placement="top">
          <i-material-symbols:help-outline></i-material-symbols:help-outline>
        </el-tooltip>
      </template>
      <template #footer>
        <div class="px-1rem w-full flex items-center">
          <el-slider
            size="small"
            @change="updateTopic"
            show-input
            v-model="topic.maxContextLength"
            :min="-1"
            :max="30"
            :step="1"></el-slider>
        </div>
      </template>
    </ContentBox>
    <el-divider class="my-.25rem!"></el-divider>
  </div>
</template>
<style lang="scss" scoped></style>
