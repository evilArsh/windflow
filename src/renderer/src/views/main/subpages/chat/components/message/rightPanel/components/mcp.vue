<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import useMcpStore from "@renderer/store/mcp.store"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import { CallBackFn } from "@renderer/lib/shared/types"
import ILight from "~icons/fxemoji/lightbulb"
import IProhibited from "~icons/fluent-emoji-flat/prohibited"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { cloneDeep } from "lodash-es"
import { errorToText } from "@shared/error"
import MCPForm from "@renderer/views/main/subpages/mcp/subpages/index/components/form.vue"
import { PopoverInstance } from "element-plus"
const props = defineProps<{
  modelValue: ChatTopic
}>()
const emit = defineEmits<{
  "update:modelValue": [ChatTopic]
}>()
const node = computed<ChatTopic>({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
const { t } = useI18n()
const popoverRefs = ref<Array<PopoverInstance>>([])
const mcp = useMcpStore()
const chatStore = useChatStore()
const { servers } = storeToRefs(mcp)
const serverHandler = {
  onServerChange: async (popRef?: PopoverInstance) => {
    try {
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
      msg({ code: 200, msg: "ok" })
      popRef?.hide()
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onClose: (popRef?: PopoverInstance) => {
    popRef?.hide()
  },
  syncServers: async (done: CallBackFn) => {
    try {
      for (const server of servers.value) {
        if (server.disabled) continue
        if (node.value.mcpServers.findIndex(item => item.id === server.id) === -1) {
          node.value.mcpServers.push(server)
        }
      }
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      done()
    }
  },
}
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <div class="flex-shrink-0">
      <Button size="small" @click="serverHandler.syncServers">{{ t("btn.sync") }}</Button>
    </div>
    <div class="flex flex-1 overflow-hidden flex-col gap1rem p1rem">
      <el-scrollbar>
        <div v-for="(server, index) in node.mcpServers" :key="server.id">
          <ContentBox background>
            <template #icon>
              <el-switch
                size="small"
                v-model="server.disabled"
                :active-value="false"
                :inactive-value="true"
                :active-action-icon="ILight"
                :inactive-action-icon="IProhibited"
                @change="() => serverHandler.onServerChange()" />
            </template>
            <el-popover
              placement="left"
              :width="400"
              trigger="click"
              :ref="el => (popoverRefs[index] = el as PopoverInstance)">
              <template #reference>
                <div class="flex-1">
                  <el-text size="small" type="info">{{ server.serverName }}</el-text>
                </div>
              </template>
              <MCPForm
                class="h-500px"
                @change="serverHandler.onServerChange(popoverRefs[index])"
                @close="serverHandler.onClose(popoverRefs[index])"
                :data="server">
              </MCPForm>
            </el-popover>
          </ContentBox>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
