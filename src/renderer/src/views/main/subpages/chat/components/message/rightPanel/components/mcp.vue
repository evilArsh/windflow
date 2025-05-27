<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import useMcpStore from "@renderer/store/mcp"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import { CallBackFn } from "@renderer/lib/shared/types"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { cloneDeep } from "lodash-es"
import { errorToText } from "@shared/error"
import MCPForm from "@renderer/views/main/subpages/mcp/subpages/index/components/form.vue"
import { PopoverInstance } from "element-plus"
import { MCPServerParam } from "@shared/types/mcp"
import { code5xx } from "@shared/types/bridge"
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
const loading = ref(false) // 正在启动mcp
const popover = reactive({
  visible: false,
  ref: undefined as PopoverInstance | undefined,
  refs: [] as Array<HTMLElement>,
  server: undefined as MCPServerParam | undefined,
  triggerRef: undefined as HTMLElement | undefined,
  onClick: markRaw((index: number) => {
    popover.triggerRef = popover.refs[index]
    popover.server = node.value.mcpServers[index]
    popover.visible = true
  }),
})

const formHandler = {
  onServerToggle: async (data: MCPServerParam): Promise<boolean> => {
    try {
      if (data.disabled) {
        const res = await window.api.mcp.toggleServer(data.id, {
          command: "start",
        })
        if (code5xx(res.code)) throw new Error(res.msg)
        if (res.code == 404) {
          const res = await window.api.mcp.registerServer(cloneDeep(data))
          if (code5xx(res.code)) throw new Error(res.msg)
        }
      }
      const count = await chatStore.api.updateChatTopic(cloneDeep(node.value))
      if (count == 0) {
        throw new Error("update failed")
      }
      msg({ code: 200, msg: "ok" })
      return true
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
      return false
    }
  },
  onServerChange: async (data: MCPServerParam) => {
    try {
      popover.server && Object.assign(popover.server, data)
      await chatStore.api.updateChatTopic(cloneDeep(node.value))
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onClose: () => {
    popover.visible = false
  },
}
const serverHandler = {
  test: async (done: CallBackFn) => {
    try {
      const ids = node.value.mcpServers.map(v => v.id)
      const listTools = await window.api.mcp.listTools(ids)
      const listPrompts = await window.api.mcp.listPrompts(ids)
      const listResources = await window.api.mcp.listResources(ids)
      const listResourceTemplates = await window.api.mcp.listResourceTemplates(ids)
      console.log("[listTools]", listTools)
      console.log("[listPrompts]", listPrompts)
      console.log("[listResources]", listResources)
      console.log("[listResourceTemplates]", listResourceTemplates)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      done()
    }
  },
  syncServers: async (done: CallBackFn) => {
    try {
      for (const server of servers.value) {
        if (server.disabled) continue
        if (node.value.mcpServers.findIndex(item => item.id === server.id) === -1) {
          node.value.mcpServers.push(cloneDeep({ ...server, disabled: true }))
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
        asyncReq.push(window.api.mcp.registerServer(cloneDeep(server)))
      }
      const res = await Promise.allSettled(asyncReq)
      for (const item of res) {
        if (item.status === "rejected") {
          throw item.reason
        }
      }
    } catch (error) {
      console.log("[loadMCP]", error)
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      loading.value = false
    }
  },
  restart: async (done: CallBackFn, server: MCPServerParam) => {
    try {
      if (server.disabled) {
        throw new Error("Server is disabled")
      }
      const toggleRes = await window.api.mcp.toggleServer(server.id, {
        command: "delete",
      })
      if (code5xx(toggleRes.code)) {
        throw new Error(toggleRes.msg)
      }
      const res = await window.api.mcp.registerServer(cloneDeep(server))
      if (code5xx(res.code)) {
        throw new Error(res.msg)
      }
    } catch (error) {
      console.log("[restart]", error)
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      loading.value = false
      done()
    }
  },
  del: (index: number) => {
    node.value.mcpServers.splice(index, 1)
  },
}
watch(() => props.modelValue, serverHandler.loadMCP, { immediate: true })
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <div class="flex-shrink-0 flex gap1rem">
      <Button size="small" @click="serverHandler.syncServers">{{ t("btn.sync") }}</Button>
      <Button size="small" @click="serverHandler.test">测试</Button>
    </div>
    <div v-loading="loading" class="flex flex-1 overflow-hidden flex-col">
      <el-scrollbar>
        <div v-for="(server, index) in node.mcpServers" :key="server.id">
          <ContentBox :ref="el => (popover.refs[index] = el as HTMLElement)" background>
            <template #icon>
              <Switch
                size="small"
                style="--el-switch-off-color: #ff4949"
                v-model="server.disabled"
                :active-value="false"
                :inactive-value="true"
                :before-change="() => formHandler.onServerToggle(server)" />
            </template>
            <McpName :data="server"></McpName>
            <template #footer>
              <div class="flex items-center gap-.5rem" @click.stop>
                <ContentBox class="flex-grow-0!" @click.stop="popover.onClick(index)">
                  <i class="i-ep:edit"></i>
                </ContentBox>
                <ContentBox class="flex-grow-0!" @click.stop>
                  <Button text link type="warning" @click="done => serverHandler.restart(done, server)">
                    <i class="i-ep:refresh text-1.4rem"></i>
                  </Button>
                </ContentBox>
                <el-popconfirm :title="t('tip.deleteConfirm')" @confirm="serverHandler.del(index)">
                  <template #reference>
                    <ContentBox class="flex-grow-0!" @click.stop>
                      <el-button text link type="danger">
                        <i class="i-ep:delete text-1.4rem"></i>
                      </el-button>
                    </ContentBox>
                  </template>
                  <template #actions="{ confirm, cancel }">
                    <div class="flex justify-between">
                      <el-button type="danger" size="small" @click="confirm">{{ t("tip.yes") }}</el-button>
                      <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
                    </div>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </ContentBox>
          <el-divider class="my-.25rem!"></el-divider>
        </div>
      </el-scrollbar>
    </div>
    <el-popover
      popper-style="--el-popover-padding: 0"
      :visible="popover.visible"
      virtual-triggering
      :virtual-ref="popover.triggerRef"
      placement="left"
      :width="800"
      trigger="click"
      :ref="el => (popover.ref = el as PopoverInstance)">
      <template #reference>
        <ContentBox class="flex-grow-0! flex-shrink-0!" @click.stop>
          <i class="i-ep:edit"></i>
        </ContentBox>
      </template>
      <MCPForm
        class="h-500px"
        @change="data => formHandler.onServerChange(data)"
        @close="formHandler.onClose()"
        :data="popover.server">
      </MCPForm>
    </el-popover>
  </div>
</template>
<style lang="scss" scoped></style>
