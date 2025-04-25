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
const activeClick = ref("") // 点击的项
const loading = ref(false) // 正在启动mcp

const formHandler = {
  onServerToggle: async () => {
    try {
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
      msg({ code: 200, msg: "ok" })
      activeClick.value = ""
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onServerChange: async (data: MCPStdioServer, index: number) => {
    try {
      Object.assign(node.value.mcpServers[index], data)
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
      msg({ code: 200, msg: "ok" })
      activeClick.value = ""
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onClose: (popRef?: PopoverInstance) => {
    activeClick.value = ""
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
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      done()
    }
  },
  loadMCP: async () => {
    try {
      loading.value = true
      for (const server of props.modelValue.mcpServers) {
        if (server.disabled) continue
        await window.api.mcp.registerServer(server.id, cloneDeep(server))
      }
    } catch (error) {
      console.log("[loadMCP]", error)
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      loading.value = false
    }
  },
  restart: async (done: CallBackFn, server: MCPStdioServer) => {
    try {
      await window.api.mcp.toggleServer(server.id, {
        command: "restart",
      })
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
          <ContentBox still-lock @click="activeClick = server.id" :default-lock="activeClick == server.id" background>
            <template #icon>
              <el-switch
                size="small"
                v-model="server.disabled"
                :active-value="false"
                :inactive-value="true"
                :active-action-icon="ILight"
                :inactive-action-icon="IProhibited"
                @change="formHandler.onServerToggle" />
            </template>
            <el-popover
              @hide="activeClick = ''"
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
                @change="data => formHandler.onServerChange(data, index)"
                @close="formHandler.onClose(popoverRefs[index])"
                :data="server">
              </MCPForm>
            </el-popover>
            <template #footer>
              <div class="flex items-center gap-.5rem" @click.stop>
                <Button size="small" round circle @click="done => serverHandler.restart(done, server)">
                  <i class="i-ic:baseline-refresh text-1.6rem"></i>
                </Button>
                <!-- <ContentBox class="flex-grow-0! flex-shrink-0!" @click.stop>
                  <i class="i-ic:baseline-refresh"></i>
                </ContentBox> -->
              </div>
            </template>
          </ContentBox>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
