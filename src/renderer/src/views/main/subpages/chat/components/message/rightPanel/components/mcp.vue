<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import useMcpStore from "@renderer/store/mcp"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import { CallBackFn } from "@renderer/lib/shared/types"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { errorToText } from "@shared/error"
import MCPForm from "@renderer/views/main/subpages/mcp/subpages/index/components/form.vue"
import { PopoverInstance } from "element-plus"
import { MCPClientStatus, MCPServerParam } from "@shared/types/mcp"
import { code5xx } from "@shared/types/bridge"
import { ElNotification, ElMessageBox } from "element-plus"
const props = defineProps<{
  topic: ChatTopic
}>()
const topic = computed<ChatTopic>(() => props.topic)
const { t } = useI18n()
const mcp = useMcpStore()
const chatStore = useChatStore()
const { servers } = storeToRefs(mcp)
const activeServerIds = ref<string[]>([])
const popover = reactive({
  visible: false,
  ref: undefined as PopoverInstance | undefined,
  refs: [] as Array<HTMLElement>,
  server: undefined as MCPServerParam | undefined,
  triggerRef: undefined as HTMLElement | undefined,
  onClick: markRaw((index: number, server: MCPServerParam) => {
    popover.triggerRef = popover.refs[index]
    popover.server = mcp.findServer(server.id)
    popover.visible = true
  }),
  onHide: markRaw(() => {
    popover.visible = false
  }),
})

const formHandler = {
  onServerChange: async (data: MCPServerParam) => {
    try {
      // popover.server && Object.assign(popover.server, data)
      // await chatStore.api.updateChatTopic(cloneDeep(topic.value))
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onClose: () => {
    popover.visible = false
  },
}
const serverHandler = {
  showErrorDlg: (data: MCPServerParam, msg: string) => {
    ElNotification({
      title: t("notify.title.error"),
      message: t("mcp.service.disconnected", {
        service: data.serverName,
        message: msg,
      }),
      duration: 5000,
      type: "error",
    })
  },
  onServerToggle: async (server: MCPServerParam) => {
    console.log(server)
    mcp.toggleServer(server.id, topic.value.id).then(res => {
      if (code5xx(res.code)) {
        serverHandler.showErrorDlg(server, res.msg)
      }
    })
  },
  refreshMcp: async (current: ChatTopic) => {
    const id = current.id
    const mcpServersIds = (await window.api.mcp.getTopicServers(id)).data
    if (topic.value.id !== id) return
    activeServerIds.value = mcpServersIds
  },
  restart: async (done: CallBackFn, server: MCPServerParam) => {
    try {
      const refs = (await window.api.mcp.getReferences(server.id)).data
      if (refs.length > 0) {
        await ElMessageBox.confirm(t("mcp.service.deleteConfirm", { count: refs.length }), t("notify.title.warning"), {
          confirmButtonText: t("btn.confirm"),
          cancelButtonText: t("btn.cancel"),
          type: "warning",
        })
      }
      const toggleRes = await window.api.mcp.toggleServer(topic.value.id, server.id, {
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
      done()
    }
  },
  // del: (index: number) => {
  //   const res = topic.value.mcpServers.splice(index, 1)
  //   if (res.length) {
  //     // 仅删除引用
  //     window.api.mcp.toggleServer(topic.value.id, res[0].id, { command: "delete" })
  //   }
  // },
}
watch(topic, serverHandler.refreshMcp, { immediate: true })
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <!-- <div class="flex-shrink-0 flex">
      <Button size="small" @click="serverHandler.test">测试</Button>
    </div> -->
    <div class="flex flex-1 overflow-hidden flex-col">
      <el-scrollbar>
        <div v-for="(server, index) in servers" :key="server.id">
          <ContentBox :ref="el => (popover.refs[index] = el as HTMLElement)" background>
            <template #icon>
              <i-mdi:circle-medium
                :class="[
                  activeServerIds.includes(server.id) ? 'text-[#5FADFF]' : 'text-[#c0c4cc]',
                ]"></i-mdi:circle-medium>
            </template>
            <McpName :data="server" hide-flag></McpName>
            <template #footer>
              <div class="flex items-center" @click.stop>
                <ContentBox class="flex-grow-0!" @click.stop="popover.onClick(index, server)">
                  <i class="i-ep:edit"></i>
                </ContentBox>
                <ContentBox class="flex-grow-0!" @click.stop>
                  <Button text link type="warning" @click="done => serverHandler.restart(done, server)">
                    <i class="i-ep:refresh text-1.4rem"></i>
                  </Button>
                </ContentBox>
                <!-- <el-segmented
                  size="small"
                  style="
                    --el-segmented-item-selected-color: var(--el-text-color-primary);
                    --el-segmented-item-selected-bg-color: #ffd100;
                    --el-border-radius-base: 16px;
                  "
                  v-model="server.status"
                  :options="[
                    { label: '开启', value: MCPClientStatus.Connected },
                    { label: '关闭', value: MCPClientStatus.Disconnected },
                  ]">
                  <template #default="{ item }">
                    <div class="flex flex-col items-center gap-2 p-2"></div>
                  </template>
                </el-segmented> -->
                <!-- <el-popconfirm :title="t('tip.deleteConfirm')" @confirm="serverHandler.del(index)">
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
                </el-popconfirm> -->
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
      :ref="el => (popover.ref = el as PopoverInstance)"
      @hide="popover.onHide">
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
