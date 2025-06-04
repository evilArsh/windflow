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
import { BridgeStatusResponse, code1xx, code5xx } from "@shared/types/bridge"
import { ElNotification, ElMessageBox } from "element-plus"
const props = defineProps<{
  topic: ChatTopic
}>()
const topic = computed<ChatTopic>(() => props.topic)
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
    popover.server = topic.value.mcpServers[index]
    popover.visible = true
  }),
})

const formHandler = {
  onServerToggle: async (data: MCPServerParam): Promise<boolean> => {
    try {
      if (data.disabled) {
        const res = await window.api.mcp.toggleServer(props.topic.id, data.id, {
          command: "start",
        })
        if (code5xx(res.code)) throw new Error(res.msg)
        if (res.code == 404) {
          const res = await window.api.mcp.registerServer(props.topic.id, cloneDeep(data))
          if (code5xx(res.code)) throw new Error(res.msg)
        }
      }
      const count = await chatStore.api.updateChatTopic(cloneDeep(topic.value))
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
      await chatStore.api.updateChatTopic(cloneDeep(topic.value))
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
      const ids = topic.value.mcpServers.map(v => v.id)
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
        if (topic.value.mcpServers.findIndex(item => item.id === server.id) === -1) {
          topic.value.mcpServers.push(cloneDeep({ ...server, disabled: true }))
        }
      }
      await chatStore.api.updateChatTopic(cloneDeep(topic.value))
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
      const asyncReq: Array<Promise<{ server: MCPServerParam; data: Awaited<BridgeStatusResponse> }>> = []
      const requestWithParam = async (server: MCPServerParam, request: () => Promise<BridgeStatusResponse>) => {
        const req = request()
        const data = await req
        return { server, data }
      }
      for (const server of topic.value.mcpServers) {
        if (server.disabled) continue
        asyncReq.push(requestWithParam(server, () => window.api.mcp.registerServer(props.topic.id, cloneDeep(server))))
      }
      const res = await Promise.allSettled(asyncReq)
      for (const item of res) {
        if (item.status === "rejected") {
          throw item.reason
        } else {
          if (code1xx(item.value.data.code)) {
            ElNotification({
              title: t("notify.title.info"),
              message: t("mcp.service.connecting", {
                service: item.value.server.serverName,
              }),
              type: "info",
            })
          } else if (code5xx(item.value.data.code)) {
            ElNotification({
              title: t("notify.title.error"),
              message: t("mcp.service.disconnected", {
                service: item.value.server.serverName,
                message: item.value.data.msg,
              }),
              type: "error",
            })
          }
        }
      }
    } catch (error) {
      console.log("[loadMCP]", error)
      ElNotification({
        title: t("notify.title.warning"),
        message: errorToText(error),
        type: "warning",
      })
    } finally {
      loading.value = false
    }
  },
  restart: async (done: CallBackFn, server: MCPServerParam) => {
    try {
      if (server.disabled) {
        throw new Error("Server is disabled")
      }
      const refs = (await window.api.mcp.getReference(server.id)).data
      await ElMessageBox.confirm(t("mcp.service.deleteConfirm", { count: refs.length }), t("notify.title.warning"), {
        confirmButtonText: t("btn.confirm"),
        cancelButtonText: t("btn.cancel"),
        type: "warning",
      })
      const toggleRes = await window.api.mcp.toggleServer(props.topic.id, server.id, {
        command: "restart",
      })
      if (code5xx(toggleRes.code)) {
        ElNotification({
          title: t("notify.title.error"),
          message: toggleRes.msg,
          type: "error",
        })
        return
      }
      msg({ code: 200, msg: "ok" })
    } catch (error) {
      console.log("[restart]", error)
    } finally {
      loading.value = false
      done()
    }
  },
  del: (index: number) => {
    const res = topic.value.mcpServers.splice(index, 1)
    if (res.length) {
      // 仅删除引用
      window.api.mcp.toggleServer(props.topic.id, res[0].id, { command: "delete" })
    }
  },
}
watch(topic, serverHandler.loadMCP, { immediate: true })
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <div class="flex-shrink-0 flex gap1rem">
      <Button size="small" @click="serverHandler.syncServers">{{ t("btn.sync") }}</Button>
      <Button size="small" @click="serverHandler.test">测试</Button>
    </div>
    <div v-loading="loading" class="flex flex-1 overflow-hidden flex-col">
      <el-scrollbar>
        <div v-for="(server, index) in topic.mcpServers" :key="server.id">
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
