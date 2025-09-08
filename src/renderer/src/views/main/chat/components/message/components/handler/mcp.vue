<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import useMcpStore from "@renderer/store/mcp"
import { storeToRefs } from "pinia"
import { CallBackFn, msg, errorToText } from "@toolmain/shared"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import MCPForm from "@renderer/views/main/mcp/index/components/form/form.vue"
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
const currentLength = computed(() => filterServers.value.filter(s => isCurrentActive.value(s)).length)
const popover = shallowReactive({
  visible: false,
  server: undefined as MCPServerParam | undefined,
  onClick: (server: MCPServerParam) => {
    popover.server = mcp.clonePure(server)
    popover.visible = true
  },
  onHide: () => {
    popover.visible = false
  },
})

const formHandler = {
  onServerChange: async (data: MCPServerParam) => {
    try {
      const newCopy = mcp.clonePure(data)
      newCopy.status = MCPClientStatus.Disconnected
      newCopy.id = mcp.createNewId()
      newCopy.modifyTopic = topic.value.id
      newCopy.referId = data.referId
      newCopy.name = `${newCopy.name}_copy`
      await mcp.api.add(newCopy)
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
      await window.api.mcp.restartServer(topic.value.id, server.id)
      done()
    } catch (error) {
      done()
      console.log(error)
    }
  },
  del: async (done: CallBackFn, server: MCPServerParam) => {
    try {
      await mcp.api.del(server.id)
      const index = servers.value.findIndex(v => v.id === server.id)
      servers.value.splice(index, 1)
      mcp.stop(topic.value.id, server.id)
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
  <el-popover placement="top" :width="500" trigger="hover" popper-style="--el-popover-padding: 0">
    <template #reference>
      <el-badge :value="currentLength" type="primary" :show-zero="false">
        <ContentBox background>
          <i-twemoji:hammer-and-wrench class="text-1.6rem" />
        </ContentBox>
      </el-badge>
    </template>
    <!-- <Button size="small" @click="serverHandler.test">测试</Button> -->
    <el-card style="--el-card-padding: 1rem">
      <template #header>
        <el-text>{{ t("chat.mcp.label") }}</el-text>
      </template>
      <div class="w-full h-40rem flex">
        <el-scrollbar v-if="!popover.visible" class="w-full">
          <div>
            <div v-for="server in filterServers" :key="server.id">
              <ContentBox background>
                <template #icon>
                  <el-switch
                    class="mcp-status-switch"
                    size="small"
                    :model-value="isCurrentActive(server)"
                    :loading="server.status === MCPClientStatus.Connecting"
                    :active-value="true"
                    :inactive-value="false"
                    @click.stop="serverHandler.onServerToggle(server)" />
                </template>
                <McpName :data="server"></McpName>
                <template #end>
                  <div class="flex items-center">
                    <el-tooltip :show-after="1000" placement="bottom" :content="t('chat.mcp.clone')">
                      <ContentBox class="flex-grow-0!" @click.stop="popover.onClick(server)">
                        <i class="i-ep:copy-document"></i>
                      </ContentBox>
                    </el-tooltip>
                    <el-popconfirm
                      v-if="isCurrentActive(server)"
                      :title="t('mcp.service.deleteConfirm')"
                      :teleported="false">
                      <template #reference>
                        <ContentBox class="flex-grow-0!">
                          <el-button text link type="warning">
                            <i class="i-ep:refresh text-1.4rem"></i>
                          </el-button>
                        </ContentBox>
                      </template>
                      <template #actions="{ cancel }">
                        <div class="flex justify-between">
                          <Button type="danger" size="small" @click="done => serverHandler.restart(done, server)">
                            {{ t("tip.yes") }}
                          </Button>
                          <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
                        </div>
                      </template>
                    </el-popconfirm>
                    <el-popconfirm
                      v-if="server.modifyTopic == topic.id"
                      :title="t('tip.deleteConfirm')"
                      :teleported="false">
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
          </div>
        </el-scrollbar>
        <MCPForm
          v-else
          shadow="always"
          @change="formHandler.onServerChange"
          :form-props="{ labelPosition: 'top' }"
          @close="formHandler.onClose"
          :data="popover.server">
        </MCPForm>
      </div>
    </el-card>
  </el-popover>
</template>
<style lang="scss">
.mcp-status-switch {
  .el-switch__action {
    .el-icon.is-loading {
      color: var(--el-color-danger);
    }
  }
}
</style>
