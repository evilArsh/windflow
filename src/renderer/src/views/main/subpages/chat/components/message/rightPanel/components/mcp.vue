<script lang="ts" setup>
import { ChatTopic, MCPStdioServer } from "@renderer/types"
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
const mcp = useMcpStore()
const chatStore = useChatStore()
const { servers } = storeToRefs(mcp)

const popoverRefs = ref<Array<PopoverInstance>>([])
const loading = ref(false) // 正在启动mcp

const formHandler = {
  onServerToggle: async (data: MCPStdioServer): Promise<boolean> => {
    try {
      const finalStatus = !!data.disabled
      if (finalStatus) {
        const res = await window.api.mcp.toggleServer(data.id, {
          command: "start",
        })
        if (res.code == 404) {
          await window.api.mcp.registerServer(data.id, cloneDeep(data))
        }
      }
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
      msg({ code: 200, msg: "ok" })
      return true
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
      return false
    }
  },
  onServerChange: async (data: MCPStdioServer, index: number) => {
    try {
      Object.assign(node.value.mcpServers[index], data)
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
      msg({ code: 200, msg: "ok" })
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onClose: (popRef?: PopoverInstance) => {
    popRef?.hide()
  },
}
const serverHandler = {
  syncServers: async (done: CallBackFn) => {
    try {
      for (const server of servers.value) {
        if (server.disabled) continue
        if (node.value.mcpServers.findIndex(item => item.id === server.id) === -1) {
          node.value.mcpServers.push(server)
        }
      }
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
      await serverHandler.loadMCP()
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      done()
    }
  },
  loadMCP: async () => {
    try {
      loading.value = true
      const asyncReq: Promise<unknown>[] = []
      for (const server of props.modelValue.mcpServers) {
        if (server.disabled) continue
        asyncReq.push(window.api.mcp.registerServer(server.id, cloneDeep(server)))
      }
      await Promise.allSettled(asyncReq)
    } catch (error) {
      console.log("[loadMCP]", error)
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      loading.value = false
    }
  },
  restart: async (done: CallBackFn, server: MCPStdioServer) => {
    try {
      if (server.disabled) {
        throw new Error("Server is disabled")
      }
      await window.api.mcp.toggleServer(server.id, {
        command: "delete",
      })
      await window.api.mcp.registerServer(server.id, cloneDeep(server))
    } catch (error) {
      console.log("[restart]", error)
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      loading.value = false
      done()
    }
  },
}
watch(() => props.modelValue, serverHandler.loadMCP, { immediate: true })
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <div class="flex-shrink-0">
      <Button size="small" @click="serverHandler.syncServers">{{ t("btn.sync") }}</Button>
    </div>
    <div v-loading="loading" class="flex flex-1 overflow-hidden flex-col gap1rem p1rem">
      <el-scrollbar>
        <div v-for="(server, index) in node.mcpServers" :key="server.id">
          <ContentBox background>
            <template #icon>
              <Switch
                size="small"
                v-model="server.disabled"
                :active-value="false"
                :inactive-value="true"
                :active-action-icon="ILight"
                :inactive-action-icon="IProhibited"
                :before-change="() => formHandler.onServerToggle(server)" />
            </template>
            <el-text size="small" type="info">{{ server.serverName }}</el-text>
            <template #footer>
              <div class="flex items-center gap-.5rem" @click.stop>
                <Button size="small" round circle @click="done => serverHandler.restart(done, server)">
                  <i class="i-ic:baseline-refresh text-1.6rem"></i>
                </Button>
                <el-popover
                  placement="left"
                  :width="400"
                  trigger="click"
                  :ref="el => (popoverRefs[index] = el as PopoverInstance)">
                  <template #reference>
                    <ContentBox class="flex-grow-0! flex-shrink-0!" @click.stop>
                      <i class="i-ep:edit"></i>
                    </ContentBox>
                  </template>
                  <MCPForm
                    class="h-500px"
                    @change="data => formHandler.onServerChange(data, index)"
                    @close="formHandler.onClose(popoverRefs[index])"
                    :data="server">
                  </MCPForm>
                </el-popover>
              </div>
            </template>
          </ContentBox>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
