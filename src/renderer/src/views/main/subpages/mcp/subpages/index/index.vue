<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp"
import {
  MCPPromptItem,
  MCPResourceItem,
  MCPResourceTemplatesItem,
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
// import { useToolName } from "@shared/mcp"
// const toolName = useToolName()
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
  onCardClick: async (current: MCPServerParam) => {
    try {
      tabs.loading = true
      currentServer.value = current
      // MCP工具
      tabs.tools = (await window.api.mcp.listTools(current.id)).data
      tabs.prompts = (await window.api.mcp.listPrompts(current.id)).data.prompts
      tabs.resources = (await window.api.mcp.listResources(current.id)).data.resources
      tabs.resourceTemplates = (await window.api.mcp.listResourceTemplates(current.id)).data.resourceTemplates
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
      } else {
        await mcp.api.update(cloneDeep(data))
      }
      if (currentServer.value) Object.assign(currentServer.value, data)
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
      <el-tabs v-loading="tabs.loading" class="mcp-config-tabs" v-model="tabs.active">
        <el-tab-pane :label="t('mcp.service.tabs.config')" name="config">
          <Form
            hide-close-btn
            @change="dlg.onFormChange"
            :form-props="{ labelPosition: 'top' }"
            :data="currentServer"></Form>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.tool')" name="tool">User</el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.prompt')" name="prompt">User</el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.resource')" name="resource">User</el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.resourceTemplates')" name="resourceTemplates">User</el-tab-pane>
      </el-tabs>
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
