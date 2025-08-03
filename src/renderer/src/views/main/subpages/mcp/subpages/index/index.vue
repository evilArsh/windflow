<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp"
import { MCPClientStatus, MCPRootTopicId, MCPServerParam } from "@shared/types/mcp"
import { storeToRefs } from "pinia"
import useDialog from "@renderer/usable/useDialog"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { errorToText } from "@shared/utils"
import Form from "./components/form.vue"
import List from "./components/list.vue"
import { CallBackFn } from "@renderer/lib/shared/types"
import Loading from "./loading.vue"
import Schema from "./schema.vue"
import Prompt from "./prompt.vue"
import Resource from "./resource.vue"
import ResourceTpl from "./resourceTpl.vue"
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const { t } = useI18n()
const { dlgProps, dlgEvent, close, open } = useDialog({
  width: "70vw",
})
const tabs = shallowReactive({
  active: "config",
})
const {
  dlgProps: listDlgProps,
  dlgEvent: listDlgEvent,
  open: listDlgOpen,
  close: listDlgClose,
} = useDialog({
  width: "70vw",
})
const current = ref<MCPServerParam>()
const search = shallowReactive({
  keyword: "",
})
const filterServers = computed(() =>
  servers.value.filter(
    v =>
      (v.name.includes(search.keyword) ||
        v.params.command.includes(search.keyword) ||
        v.params.url.includes(search.keyword)) &&
      !v.modifyTopic
  )
)
const serverHandler = {
  restart: async (param: MCPServerParam) => {
    mcp.restart(MCPRootTopicId, param.id, param)
  },
  onCardClick: async (param: MCPServerParam) => {
    current.value = param
    if (param.status === MCPClientStatus.Connected) {
      mcp.fetchTools(param.id)
    } else {
      mcp.start(MCPRootTopicId, param)
    }
  },
  onCardDelete: async (done: CallBackFn, param: MCPServerParam) => {
    try {
      await mcp.remove(MCPRootTopicId, param.id)
      if (current.value?.id === param.id) {
        current.value = undefined
      }
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      done()
    }
  },
}
const dlg = {
  onFormClose: () => {
    current.value = undefined
    close()
  },
  onListClose: () => {
    listDlgClose()
  },
  onFormChange: async (data: MCPServerParam) => {
    try {
      if (!data.id) {
        data.id = mcp.createNewId()
        const res = mcp.clonePure(data)
        await mcp.api.add(res)
        servers.value.push(res)
        current.value = res
        mcp.start(MCPRootTopicId, res)
      } else {
        if (current.value) Object.assign(current.value, data)
        const newData = mcp.clonePure(data)
        await mcp.api.update(newData)
        await serverHandler.restart(newData)
      }
      msg({ code: 200, msg: "ok" })
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
}
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
      <div class="mcp-config-list">
        <div class="p1rem">
          <el-input v-model="search.keyword" :placeholder="t('mcp.search')" clearable />
        </div>
        <el-scrollbar>
          <div class="flex flex-col gap-1rem p1rem">
            <el-card
              v-for="server in filterServers"
              :key="server.id"
              shadow="hover"
              class="relative"
              style="--el-card-padding: 1rem">
              <template #header>
                <ContentBox
                  background
                  :default-lock="current?.id === server.id"
                  still-lock
                  @click.stop="serverHandler.onCardClick(server)">
                  <template #icon>
                    <i-twemoji:hammer-and-wrench class="text-1.4rem" />
                  </template>
                  <McpName :data="server"></McpName>
                  <Spinner
                    :model-value="server.status === MCPClientStatus.Connecting"
                    class="flex-shrink-0 text-1.2rem"></Spinner>
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
                      <Button type="danger" size="small" @click="done => serverHandler.onCardDelete(done, server)">
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
      <el-tabs v-if="current" class="mcp-config-tabs" v-model="tabs.active">
        <el-tab-pane :label="t('mcp.service.tabs.config')" name="config">
          <Form hide-close-btn @change="dlg.onFormChange" :form-props="{ labelPosition: 'top' }" :data="current"></Form>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.tool')" name="tool">
          <Loading v-if="current.status === MCPClientStatus.Connecting" :server="current"></Loading>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="!current.tools || current.tools.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <Schema v-for="tool in current.tools" :data="tool" :key="tool.name"></Schema>
            </div>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.prompt')" name="prompt">
          <Loading v-if="current.status === MCPClientStatus.Connecting" :server="current"></Loading>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="!current.prompts || current.prompts.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <Prompt v-for="tool in current.prompts" :data="tool" :key="tool.name"></Prompt>
            </div>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.resource')" name="resource">
          <Loading v-if="current.status === MCPClientStatus.Connecting" :server="current"></Loading>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="!current.resources || current.resources.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <Resource v-for="tool in current.resources" :data="tool" :key="tool.name"></Resource>
            </div>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane :label="t('mcp.service.tabs.resourceTemplates')" name="resourceTemplates">
          <Loading v-if="current.status === MCPClientStatus.Connecting" :server="current"></Loading>
          <el-scrollbar v-else class="flex-1">
            <el-empty v-if="!current.resourceTemplates || current.resourceTemplates.length == 0"></el-empty>
            <div v-else class="flex flex-col gap-0.5rem">
              <ResourceTpl v-for="tool in current.resourceTemplates" :data="tool" :key="tool.name"></ResourceTpl>
            </div>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
      <el-empty v-else class="mcp-config-tabs"></el-empty>
    </div>
    <el-dialog v-bind="dlgProps" v-on="dlgEvent">
      <Form class="h-70vh" @close="dlg.onFormClose" @change="dlg.onFormChange" :data="current"></Form>
    </el-dialog>
    <el-dialog v-bind="listDlgProps" v-on="listDlgEvent" style="--el-dialog-padding-primary: 0">
      <List class="h-70vh" @close="dlg.onListClose"></List>
    </el-dialog>
  </ContentLayout>
</template>
<style lang="scss" scoped>
.mcp-config-list {
  border-right: solid 1px;
  border-color: var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 30rem;
}
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
