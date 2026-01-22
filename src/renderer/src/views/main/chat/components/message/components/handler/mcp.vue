<script lang="ts" setup>
import { ChatTopic } from "@windflow/core/types"
import useMcpStore from "@renderer/store/mcp"
import { storeToRefs } from "pinia"
import { CallBackFn, errorToText } from "@toolmain/shared"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import MCPForm from "@renderer/views/main/mcp/index/components/form/form.vue"
import { MCPClientStatus, MCPServerParam } from "@windflow/shared"
import { AbbrsNode } from "@renderer/components/Abbrs"
import { Spinner } from "@toolmain/components"
import Shell from "./components/shell.vue"
import { msg } from "@renderer/utils"
import Group from "./components/group.vue"
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
const currentActive = computed<AbbrsNode[]>(() =>
  filterServers.value
    .filter(s => isCurrentActive.value(s))
    .map(v => {
      return {
        data: v.name.slice(0, 1),
        type: "text",
      }
    })
)
const currentLoading = computed(() => {
  return filterServers.value.some(v => v.status === MCPClientStatus.Connecting)
})
const usePopover = () => {
  const visible = ref(false)
  const currentServer = shallowRef<MCPServerParam>()
  function onClick(newServer: MCPServerParam) {
    currentServer.value = mcp.clonePure(newServer)
    visible.value = true
  }
  function onHide() {
    visible.value = false
  }
  async function onServerChange(data: MCPServerParam) {
    try {
      const newCopy = mcp.clonePure(data)
      newCopy.status = MCPClientStatus.Disconnected
      newCopy.id = mcp.createNewId()
      newCopy.modifyTopic = topic.value.id
      newCopy.referId = data.referId
      newCopy.name = `${newCopy.name}_copy`
      newCopy.name = servers.value.some(v => v.name === newCopy.name) ? `${newCopy.name}_copy` : newCopy.name
      await mcp.add(newCopy)
      mcp.start(topic.value.id, newCopy)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  }
  return { visible, currentServer, onClick, onHide, onServerChange }
}
const { visible, currentServer, onClick, onHide, onServerChange } = usePopover()
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
      await mcp.remove(topic.value.id, server.id)
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
  <Shell>
    <template #reference>
      <ContentBox
        style="
          --box-border-color: var(--el-border-color-light);
          --box-border-radius: 1rem;
          --box-border-size: 1px;
          --box-padding: 2px;
          --box-border-hover-color: var(--el-border-color-dark);
          --box-border-active-color: var(--el-border-color-darker);
        "
        normal>
        <div class="flex-center gap-.5rem">
          <ContentBox style="--box-border-radius: 1rem" background>
            <i-material-symbols-code-rounded class="text-1.6rem" />
          </ContentBox>
          <Abbrs
            :max-length="5"
            :spacing="10"
            style="--abbrs-padding: 3px"
            width="22"
            height="22"
            :data="currentActive"></Abbrs>
          <Spinner destroy-icon class="text-1.2rem" :model-value="currentLoading"></Spinner>
        </div>
      </ContentBox>
    </template>
    <!-- <Button size="small" @click="serverHandler.test">测试</Button> -->
    <template #header>
      <el-text>{{ t("chat.mcp.label") }}</el-text>
    </template>
    <template #default>
      <div class="w-full h-40rem">
        <template v-if="!visible">
          <Group>
            <ContentBox class="setting-box" v-for="server in filterServers" :key="server.id">
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
                    <ContentBox class="flex-grow-0!" @click.stop="onClick(server)">
                      <el-button text link>
                        <i class="i-ep-copy-document text-1.4rem"></i>
                      </el-button>
                    </ContentBox>
                  </el-tooltip>
                  <el-popconfirm
                    v-if="isCurrentActive(server)"
                    :title="t('mcp.service.deleteConfirm')"
                    :teleported="false">
                    <template #reference>
                      <ContentBox class="flex-grow-0!">
                        <el-button text link type="warning">
                          <i class="i-ep-refresh text-1.4rem"></i>
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
                          <i class="i-ep-delete text-1.4rem"></i>
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
          </Group>
        </template>
        <MCPForm
          v-else
          shadow="always"
          @change="onServerChange"
          :form-props="{ labelPosition: 'top' }"
          @close="onHide"
          :data="currentServer">
        </MCPForm>
      </div>
    </template>
  </Shell>
</template>
<style lang="scss">
@use "./components/common.scss";
.mcp-status-switch {
  .el-switch__action {
    .el-icon.is-loading {
      color: var(--el-color-danger);
    }
  }
}
</style>
