<script setup lang="ts">
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import Handler from "./handler/index.vue"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import useChatStore from "@renderer/store/chat.store"
import TextContent from "./textContent/index.vue"
import RightPanel from "./rightPanel/index.vue"
import { storeToRefs } from "pinia"
import useSettingsStore from "@renderer/store/settings.store"
import { SettingKeys } from "@renderer/types"
const settingsStore = useSettingsStore()
const { currentTopic, currentMessage } = storeToRefs(useChatStore())
const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const shortcut = useShortcut()
const togglePanel = ref(true) // 右侧面板是否显示
const message = computed(() => currentMessage.value?.data ?? [])
shortcut.listen("ctrl+shift+b", res => {
  if (res.active) {
    togglePanel.value = !togglePanel.value
  }
})
settingsStore.api.dataWatcher<boolean>(SettingKeys.ChatTogglePanel, togglePanel, true)
const handler = {
  onMessageSend: () => {
    setTimeout(() => {
      contentLayout.value?.scrollToBottom("instant")
    }, 0)
  },
}
</script>
<template>
  <div v-if="currentTopic" class="flex flex-1 overflow-hidden">
    <ContentLayout v-model:handler-height="currentTopic.node.inputHeight" ref="contentLayout" chat-mode>
      <template #header>
        <el-card class="chat-header" shadow="never">
          <div class="flex justify-between">
            <div class="flex items-center gap1rem">
              <slot name="leftHandler"></slot>
            </div>
            <div class="flex items-center gap1rem">
              <ContentBox @click="togglePanel = !togglePanel" background>
                <i-mdi:arrow-collapse-left v-if="!togglePanel"></i-mdi:arrow-collapse-left>
                <i-mdi:arrow-collapse-right v-else></i-mdi:arrow-collapse-right>
              </ContentBox>
            </div>
          </div>
        </el-card>
      </template>
      <div class="flex flex-col-reverse p-1.5rem gap2.5rem">
        <TextContent v-for="data in message" :key="data.id" :data="data" />
      </div>
      <template #handler>
        <Handler @message-send="handler.onMessageSend" @context-clean="handler.onMessageSend"></Handler>
      </template>
    </ContentLayout>
    <RightPanel v-show="togglePanel" v-model="currentTopic.node"></RightPanel>
  </div>
  <div v-else class="flex flex-1 items-center justify-center">
    <el-empty />
  </div>
</template>
<style lang="scss" scoped>
.chat-header {
  --el-card-border-color: transparent;
  --el-card-border-radius: 0;
  --el-card-padding: 0.5rem;
  width: 100%;
}
</style>
