<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp.store"
import { MCPServerParam } from "@shared/types/mcp"
import ITerminal from "~icons/material-symbols/terminal"
import { storeToRefs } from "pinia"
import useDialog from "@renderer/usable/useDialog"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { cloneDeep } from "lodash-es"
import { errorToText } from "@shared/error"
import Form from "./components/form.vue"
import List from "./components/list.vue"
import ILight from "~icons/fxemoji/lightbulb"
import IProhibited from "~icons/fluent-emoji-flat/prohibited"
import { CallBackFn } from "@renderer/lib/shared/types"
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
const onCardClick = (current: MCPServerParam) => {
  currentServer.value = current
  open()
}
const onCardDelete = async (done: CallBackFn, current: MCPServerParam, index: number) => {
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
}
const serverHandler = {
  onSwitchChange: async (server: MCPServerParam) => {
    try {
      await mcp.api.update(cloneDeep(server))
    } catch (error) {
      server.disabled = !server.disabled
      msg({ code: 500, msg: errorToText(error) })
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
      if (currentServer.value) Object.assign(currentServer.value, data)
      if (!data.id) {
        data.id = uniqueId()
        const res = cloneDeep(data)
        await mcp.api.add(res)
        servers.value.push(res)
      } else {
        await mcp.api.update(cloneDeep(data))
      }
      msg({ code: 200, msg: "ok" })
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
}
</script>
<template>
  <ContentLayout>
    <template #header>
      <div class="p-1rem flex-1 flex flex-col">
        <div class="flex items-center gap1rem">
          <el-button type="primary" size="small" @click="open">{{ t("btn.new") }}</el-button>
          <el-button type="warning" size="small" @click="listDlgOpen">{{ t("btn.mcpList") }}</el-button>
        </div>
        <el-divider class="my-1rem!"></el-divider>
      </div>
    </template>
    <el-row>
      <el-col :xl="4" :lg="6" :md="8" :sm="12" :xs="24" v-for="(server, index) in servers" :key="server.id">
        <div class="p1rem">
          <el-card shadow="hover" style="--el-card-padding: 1rem">
            <template #header>
              <ContentBox>
                <template #icon>
                  <ITerminal class="text-2rem"></ITerminal>
                </template>
                <McpName :data="server"></McpName>
                <template #footer>
                  <el-switch
                    v-model="server.disabled"
                    :active-value="false"
                    :inactive-value="true"
                    :active-action-icon="ILight"
                    :inactive-action-icon="IProhibited"
                    @change="serverHandler.onSwitchChange(server)" />
                </template>
              </ContentBox>
            </template>
            <el-scrollbar height="100px">
              <el-text type="info">{{ server.description }}</el-text>
            </el-scrollbar>
            <template #footer>
              <div class="flex gap1rem">
                <el-button @click.stop="onCardClick(server)">{{ t("btn.edit") }}</el-button>
                <el-popconfirm :title="t('tip.deleteConfirm')">
                  <template #reference>
                    <el-button type="danger">
                      {{ t("btn.delete") }}
                    </el-button>
                  </template>
                  <template #actions="{ cancel }">
                    <div class="flex justify-between">
                      <Button type="danger" size="small" @click="done => onCardDelete(done, server, index)">
                        {{ t("tip.yes") }}
                      </Button>
                      <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
                    </div>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-card>
        </div>
      </el-col>
    </el-row>
    <el-dialog v-bind="dlgProps" v-on="dlgEvent">
      <Form class="h-70vh" @close="dlg.onFormClose" @change="dlg.onFormChange" :data="currentServer"></Form>
    </el-dialog>
    <el-dialog v-bind="listDlgProps" v-on="listDlgEvent">
      <List class="h-70vh" @close="dlg.onListClose"></List>
    </el-dialog>
  </ContentLayout>
</template>
