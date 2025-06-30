<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import useMcpStore from "@renderer/store/mcp"
import { storeToRefs } from "pinia"
import { CallBackFn } from "@renderer/lib/shared/types"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { errorToText } from "@shared/error"
import MCPForm from "@renderer/views/main/subpages/mcp/subpages/index/components/form.vue"
import { ElMessageBox, PopoverInstance } from "element-plus"
import { MCPClientStatus, MCPServerParam } from "@shared/types/mcp"
const props = defineProps<{
  topic: ChatTopic
}>()
const topic = computed<ChatTopic>(() => props.topic)
const { t } = useI18n()
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const isCurrentActive = computed(() => {
  return (server: MCPServerParam) =>
    server.status == MCPClientStatus.Connected && server.referTopics?.includes(topic.value.id)
})
const filterServers = computed(() => {
  return servers.value.filter(v => !v.modifyTopic || v.modifyTopic === topic.value.id)
})
const popover = reactive({
  visible: false,
  ref: undefined as PopoverInstance | undefined,
  refs: [] as Array<HTMLElement>,
  server: undefined as MCPServerParam | undefined,
  triggerRef: undefined as HTMLElement | undefined,
  onClick: markRaw((index: number, server: MCPServerParam) => {
    popover.triggerRef = popover.refs[index]
    popover.server = mcp.clonePure(server)
    popover.visible = true
  }),
  onHide: markRaw(() => {
    popover.visible = false
  }),
})

const formHandler = {
  onServerChange: async (data: MCPServerParam) => {
    try {
      const newCopy = mcp.clonePure(data)
      newCopy.status = MCPClientStatus.Disconnected
      newCopy.id = uniqueId()
      newCopy.modifyTopic = topic.value.id
      newCopy.referId = data.referId
      newCopy.name = `${newCopy.name}_copy`
      const res = await mcp.api.add(newCopy)
      if (res === 0) {
        throw new Error(t("chat.rightPanel.mcp.addFailed"))
      }
      const index = servers.value.findIndex(v => v.id === popover.server?.id)
      servers.value.splice(index + 1, 0, newCopy)
      mcp.start(topic.value.id, newCopy)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onClose: () => {
    popover.visible = false
  },
}
const serverHandler = {
  onServerToggle: async (server: MCPServerParam): Promise<void> => {
    try {
      if (server.status == MCPClientStatus.Connected && server.referTopics?.includes(topic.value.id)) {
        mcp.stop(topic.value.id, server.id)
      } else {
        mcp.start(topic.value.id, server)
      }
    } catch (error) {
      console.log(error)
    }
  },
  restart: async (done: CallBackFn, server: MCPServerParam) => {
    try {
      const refs = (await window.api.mcp.getReferences(server.id)).data
      if (refs.length > 1) {
        await ElMessageBox.confirm(t("mcp.service.deleteConfirm", { count: refs.length }), t("notify.title.warning"), {
          confirmButtonText: t("btn.confirm"),
          cancelButtonText: t("btn.cancel"),
          type: "warning",
        })
      }
      await window.api.mcp.restartServer(topic.value.id, server.id)
      done()
    } catch (error) {
      done()
      console.log(error)
    }
  },
  del: async (done: CallBackFn, server: MCPServerParam) => {
    try {
      mcp.stop(topic.value.id, server.id)
      const res = await mcp.api.del(server.id)
      if (res === 0) {
        throw new Error(t("chat.rightPanel.mcp.delFailed"))
      }
      const index = servers.value.findIndex(v => v.id === server.id)
      servers.value.splice(index, 1)
      done()
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
      console.log(error)
      done()
    }
  },
}
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <!-- <Button size="small" @click="serverHandler.test">测试</Button> -->
    <div class="flex flex-1 overflow-hidden flex-col">
      <el-scrollbar>
        <div v-for="(server, index) in filterServers" :key="server.id">
          <ContentBox :ref="el => (popover.refs[index] = el as HTMLElement)" background>
            <template #icon>
              <el-switch
                size="small"
                :model-value="isCurrentActive(server)"
                :loading="server.status === MCPClientStatus.Connecting"
                :active-value="true"
                :inactive-value="false"
                @click="serverHandler.onServerToggle(server)" />
            </template>
            <McpName :data="server" hide-flag></McpName>
            <template #footer>
              <div class="flex items-center">
                <el-tooltip :show-after="1000" placement="bottom" :content="t('chat.rightPanel.mcp.clone')">
                  <ContentBox class="flex-grow-0!" @click.stop="popover.onClick(index, server)">
                    <i class="i-ep:copy-document c-#888"></i>
                  </ContentBox>
                </el-tooltip>
                <el-tooltip :show-after="1000" placement="bottom" :content="t('chat.rightPanel.mcp.restart')">
                  <ContentBox class="flex-grow-0!">
                    <Button
                      :disabled="!isCurrentActive(server)"
                      text
                      link
                      type="warning"
                      @click="done => serverHandler.restart(done, server)">
                      <i class="i-ep:refresh text-1.4rem"></i>
                    </Button>
                  </ContentBox>
                </el-tooltip>
                <el-popconfirm v-if="server.modifyTopic == topic.id" :title="t('tip.deleteConfirm')">
                  <template #reference>
                    <ContentBox class="flex-grow-0!">
                      <el-button text link type="danger">
                        <i class="i-ep:delete text-1.4rem"></i>
                      </el-button>
                    </ContentBox>
                  </template>
                  <template #actions="{ cancel }">
                    <div class="flex justify-between">
                      <Button type="danger" size="small" @click="done => serverHandler.del(done, server)">
                        {{ t("tip.yes") }}
                      </Button>
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
      :ref="el => (popover.ref = el as PopoverInstance)"
      @hide="popover.onHide">
      <template #reference>
        <ContentBox class="flex-grow-0! flex-shrink-0!">
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
