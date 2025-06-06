<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp"
import {
  MCPClientStatus,
  MCPPromptItem,
  MCPResourceItem,
  MCPResourceTemplatesItem,
  MCPRootTopicId,
  MCPServerParam,
  MCPToolDetail,
} from "@shared/types/mcp"
import { storeToRefs } from "pinia"
import useDialog from "@renderer/usable/useDialog"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { cloneDeep } from "lodash-es"
import { errorToText } from "@shared/error"
import Form from "./components/form.vue"
import List from "./components/list.vue"
import { CallBackFn } from "@renderer/lib/shared/types"
import { useDebounceFn } from "@vueuse/core"
import { code1xx, code2xx } from "@shared/types/bridge"
import Retry from "./retry.vue"
import Schema from "./schema.vue"
import Prompt from "./prompt.vue"
import Resource from "./resource.vue"
import ResourceTpl from "./resourceTpl.vue"
import { ElNotification } from "element-plus"
import { useToolName } from "@shared/mcp"
const toolName = useToolName()
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const { t } = useI18n()
const { dlgProps, dlgEvent, close, open } = useDialog({
  width: "70vw",
})
const {
  dlgProps: listDlgProps,
  dlgEvent: listDlgEvent,
  open: listDlgOpen,
  close: listDlgClose,
} = useDialog({
  width: "70vw",
})
const currentServer = ref<MCPServerParam>()
const serverHandler = {
  getMcpTools: async () => {
    if (!currentServer.value) return
    currentServer.value.status = MCPClientStatus.Connecting
    const res = await window.api.mcp.registerServer(MCPRootTopicId, cloneDeep(currentServer.value))
    currentServer.value.status = res.data
    if (code2xx(res.code)) {
      // MCP工具
      tabs.tools = (await window.api.mcp.listTools(currentServer.value.id)).data.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
      tabs.prompts = (await window.api.mcp.listPrompts(currentServer.value.id)).data.prompts.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
      tabs.resources = (await window.api.mcp.listResources(currentServer.value.id)).data.resources.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
      tabs.resourceTemplates = (
        await window.api.mcp.listResourceTemplates(currentServer.value.id)
      ).data.resourceTemplates.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
    } else if (code1xx(res.code)) {
      ElNotification({
        title: t("notify.title.info"),
        message: t("mcp.service.connecting"),
        type: "info",
        duration: 5000,
      })
    } else {
      ElNotification({
        title: t("notify.title.warning"),
        message: res.msg,
        type: "warning",
        duration: 5000,
      })
    }
  },
  restart: async (data: MCPServerParam) => {
    const notify = ElNotification({
      title: t("notify.title.info"),
      message: t("mcp.service.connecting"),
      type: "info",
      showClose: false,
    })
    try {
      const res = await window.api.mcp.toggleServer(MCPRootTopicId, data.id, { command: "restart" })
      if (code2xx(res.code)) {
        await serverHandler.getMcpTools()
      } else if (res.code == 404) {
        serverHandler.getMcpTools()
      } else {
        throw new Error(res.msg)
      }
    } finally {
      notify.close()
    }
  },
  onCardClick: async (current: MCPServerParam) => {
    try {
      tabs.loading = true
      currentServer.value = current
      tabs.tools.length = 0
      tabs.prompts.length = 0
      tabs.resources.length = 0
      tabs.resourceTemplates.length = 0
      serverHandler.getMcpTools()
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      tabs.loading = false
    }
  },
  onCardDelete: async (done: CallBackFn, current: MCPServerParam, index: number) => {
    try {
      const res = await mcp.api.del(current.id)
      if (res == 0) {
        msg({ code: 200, msg: t("tip.deleteFailed") })
        return
      }
      servers.value.splice(index, 1)
    } catch (error) {
      msg(errorToText(error))
    } finally {
      done()
    }
  },
}
const dlg = {
  onFormClose: () => {
    currentServer.value = undefined
    close()
  },
  onListClose: () => {
    listDlgClose()
  },
  onFormChange: async (data: MCPServerParam) => {
    try {
      if (!data.id) {
        data.id = uniqueId()
        const res = cloneDeep(data)
        await mcp.api.add(res)
        servers.value.push(res)
        currentServer.value = res
        if (!data.disabled) {
          await serverHandler.getMcpTools()
        }
      } else {
        if (currentServer.value) Object.assign(currentServer.value, data)
        await mcp.api.update(cloneDeep(data))
        if (!data.disabled) {
          await serverHandler.restart(data)
        }
      }
      msg({ code: 200, msg: "ok" })
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
}
const tabs = reactive({
  loading: false,
  active: "config",
  tools: [] as MCPToolDetail[],
  prompts: [] as MCPPromptItem[],
  resources: [] as MCPResourceItem[],
  resourceTemplates: [] as MCPResourceTemplatesItem[],
})
const search = reactive({
  keyword: "",
  query: useDebounceFn(() => {}),
})
</script>
<template>
  <ContentLayout custom>
    <template #header>
      <div class="p-1rem flex-1 flex flex-col">
        <div class="flex items-center">
          <el-button type="primary" size="small" @click="open">{{ t("btn.new") }}</el-button>
          <el-button type="warning" size="small" @click="listDlgOpen">{{ t("btn.mcpList") }}</el-button>
        </div>
      </div>
    </template>
    <div class="flex flex-1 overflow-hidden gap1rem">
      <div class="flex flex-col overflow-hidden w-30rem">
        <div class="p1rem">
          <el-input v-model="search.keyword" :placeholder="t('mcp.search')" @input="search.query" clearable />
        </div>
        <el-scrollbar>
          <div class="flex flex-col gap-1rem p1rem">
            <el-card
              v-for="(server, index) in servers"
              :key="server.id"
              shadow="hover"
              class="relative"
              style="--el-card-padding: 1rem">
              <template #header>
                <ContentBox
                  background
                  :default-lock="currentServer?.id === server.id"
                  still-lock
                  @click.stop="serverHandler.onCardClick(server)">
                  <template #icon>
                    <i-twemoji:hammer-and-wrench class="text-1.4rem" />
                  </template>
                  <McpName :data="server"></McpName>
                </ContentBox>
              </template>
              <div class="flex">
                <el-popconfirm :title="t('tip.deleteConfirm')">
                  <template #reference>
                    <el-button size="small" type="danger">
                      {{ t("btn.delete") }}
                    </el-button>
                  </template>
                  <template #actions="{ cancel }">
                    <div class="flex justify-between">
                      <Button
                        type="danger"
                        size="small"
                        @click="done => serverHandler.onCardDelete(done, server, index)">
                        {{ t("tip.yes") }}
                      </Button>
                      <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
                    </div>
                  </template>
                </el-popconfirm>
              </div>
            </el-card>
          </div>
        </el-scrollbar>
      </div>
      <el-tabs v-if="currentServer" v-loading="tabs.loading" class="mcp-config-tabs" v-model="tabs.active">
        <el-tab-pane :label="t('mcp.service.tabs.config')" name="config">
          <Form
            hide-close-btn
            @change="dlg.onFormChange"
            :form-props="{ labelPosition: 'top' }"
            :data="currentServer"></Form>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.tool')" name="tool">
          <Retry
            v-if="currentServer.status !== MCPClientStatus.Connected"
            @retry="serverHandler.getMcpTools"
            :server="currentServer"></Retry>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="tabs.tools.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <Schema v-for="tool in tabs.tools" :data="tool" :key="tool.name"></Schema>
            </div>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.prompt')" name="prompt">
          <Retry
            v-if="currentServer.status !== MCPClientStatus.Connected"
            @retry="serverHandler.getMcpTools"
            :server="currentServer"></Retry>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="tabs.prompts.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <Prompt v-for="tool in tabs.prompts" :data="tool" :key="tool.name"></Prompt>
            </div>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.resource')" name="resource">
          <Retry
            v-if="currentServer.status !== MCPClientStatus.Connected"
            @retry="serverHandler.getMcpTools"
            :server="currentServer"></Retry>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="tabs.resources.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <Resource v-for="tool in tabs.resources" :data="tool" :key="tool.name"></Resource>
            </div>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.resourceTemplates')" name="resourceTemplates">
          <Retry
            v-if="currentServer.status !== MCPClientStatus.Connected"
            @retry="serverHandler.getMcpTools"
            :server="currentServer"></Retry>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="tabs.resourceTemplates.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <ResourceTpl v-for="tool in tabs.resourceTemplates" :data="tool" :key="tool.name"></ResourceTpl>
            </div>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
      <el-empty v-else class="mcp-config-tabs"></el-empty>
    </div>
    <el-dialog v-bind="dlgProps" v-on="dlgEvent">
      <Form class="h-70vh" @close="dlg.onFormClose" @change="dlg.onFormChange" :data="currentServer"></Form>
    </el-dialog>
    <el-dialog v-bind="listDlgProps" v-on="listDlgEvent">
      <List class="h-70vh" @close="dlg.onListClose"></List>
    </el-dialog>
  </ContentLayout>
</template>
<style lang="scss" scoped>
.mcp-config-tabs {
  flex: 1;
  :deep(.el-tabs__content) {
    display: flex;
  }
  :deep(.el-tab-pane) {
    overflow: hidden;
    flex: 1;
    display: flex;
  }
}
</style>
