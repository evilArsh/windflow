<script setup lang="ts">
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import ModelSelect from "../../modelSelect/index.vue"
import TextInput from "../textInput/index.vue"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import useSettingsStore from "@renderer/store/settings.store"
import { SettingKeys } from "@renderer/types"
import { ElMessageBox } from "element-plus"
const settingsStore = useSettingsStore()
const { currentTopic } = storeToRefs(useChatStore())
const { settings } = storeToRefs(settingsStore)
const { t } = useI18n()
const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const shortcut = useShortcut()
const chatStore = useChatStore()
const handler = {
  cleanMessage: async (res: { active: boolean }) => {
    if (res.active && currentTopic.value?.node) {
      ElMessageBox.confirm
    }
  },
  cleanContext: async (res: { active: boolean }) => {
    if (res.active && currentTopic.value?.node) {
      ElMessageBox.confirm
    }
  },
  send: async (res: { active: boolean }, done?: unknown) => {
    if (res.active && currentTopic.value?.node) {
      chatStore.send(currentTopic.value.node)
      await nextTick()
      contentLayout.value?.scrollToBottom("instant")
      if (isFunction(done)) done()
    }
  },
}
const { key: cleanMessageKey, trigger: triggerCleanMessage } = shortcut.listen("ctrl+l", handler.cleanMessage)
const { key: cleanContextKey, trigger: triggerCleanContext } = shortcut.listen("ctrl+k", handler.cleanContext)
const { key: sendShortcut, trigger: triggerSend } = shortcut.listen("enter", handler.send)
watch(
  settings,
  val => {
    if (val[SettingKeys.ChatSendShortcut]) {
      sendShortcut.value = val[SettingKeys.ChatSendShortcut].value as string
    }
  },
  { immediate: true, deep: true }
)
</script>
<template>
  <div v-if="currentTopic" class="chat-input-container">
    <div class="chat-input-header">
      <div>
        <ModelSelect v-model="currentTopic.node" />
      </div>
      <div class="flex gap.5rem bg-#9f9f9f40 b-rd-.5rem">
        <ContentBox background @click="triggerCleanMessage">
          <el-tooltip placement="top" :content="t('chat.cleanMessage', { shortcut: cleanMessageKey })">
            <i-icon-park-outline:delete class="text-1.4rem"></i-icon-park-outline:delete>
          </el-tooltip>
        </ContentBox>
        <ContentBox background @click="triggerCleanContext">
          <el-tooltip placement="top" :content="t('chat.cleanContext', { shortcut: cleanContextKey })">
            <i-icon-park-outline:clear-format class="text-1.4rem"></i-icon-park-outline:clear-format>
          </el-tooltip>
        </ContentBox>
      </div>
    </div>
    <TextInput v-model="currentTopic.node.content" />
    <div class="chat-input-actions">
      <Button size="small" type="default" plain @click="done => triggerSend(done)">
        {{ t("btn.send", { shortcut: sendShortcut }) }}
      </Button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-input-container {
  --chat-input-actions-bg-color: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  .chat-input-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  .chat-input-actions {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-input-actions-bg-color);
    justify-content: flex-end;
    gap: 1rem;
  }
}
</style>
