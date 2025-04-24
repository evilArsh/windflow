<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp.store"
import { MCPStdioServer } from "@renderer/types"
import ITerminal from "~icons/material-symbols/terminal"
import { storeToRefs } from "pinia"
import useDialog from "@renderer/usable/useDialog"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { cloneDeep } from "lodash"
import { errorToText } from "@shared/error"
import Form from "./components/form.vue"
import ILight from "~icons/fxemoji/lightbulb"
import IProhibited from "~icons/fluent-emoji-flat/prohibited"
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const { t } = useI18n()
const { dlgProps, dlgEvent, close, open } = useDialog({
  draggable: true,
  lockScroll: true,
  center: false,
  top: "10vh",
  destroyOnClose: true,
  overflow: true,
  width: "70vw",
})
const formRef = useTemplateRef("form")
const currentServer = ref<MCPStdioServer>()
const onCardClick = (current: MCPStdioServer) => {
  currentServer.value = current
  open()
}
const serverHandler = {
  onSwitchChange: async (server: MCPStdioServer) => {
    try {
      await mcp.api.update(cloneDeep(server))
    } catch (error) {
      server.disabled = !server.disabled
      msg({ code: 500, msg: errorToText(error) })
    }
  },
}
const dlg = {
  save: async (done: CallBackFn) => {
    if (!formRef.value) {
      done()
      return
    }
    const formData = formRef.value.getFormData()
    formRef.value.validate(async valid => {
      try {
        if (valid) {
          if (!formData.id) {
            formData.id = uniqueId()
            await mcp.api.add(cloneDeep(formData))
            servers.value.push(cloneDeep(formData))
          } else {
            await mcp.api.update(cloneDeep(formData))
            currentServer.value && Object.assign(currentServer.value, formData)
          }
          dlg.close()
        }
      } catch (error) {
        msg({ code: 500, msg: errorToText(error) })
      } finally {
        done()
      }
    })
  },
  close: () => {
    currentServer.value = undefined
    close()
  },
}
</script>
<template>
  <ContentLayout>
    <template #header>
      <div class="p-1rem flex-1 flex flex-col">
        <div>
          <el-button type="primary" size="small" @click="open">{{ t("btn.new") }}</el-button>
        </div>
        <el-divider class="my-1rem!"></el-divider>
      </div>
    </template>
    <el-row>
      <el-col :xl="4" :lg="6" :md="8" :sm="12" :xs="24" v-for="server in servers" :key="server.id">
        <div class="p1rem">
          <el-card shadow="hover" style="--el-card-padding: 1rem">
            <template #header>
              <ContentBox>
                <template #icon>
                  <ITerminal class="text-2rem"></ITerminal>
                </template>
                <el-text class="mcp-tree-label" line-clamp="2">{{ server.serverName }}</el-text>
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
              <el-button @click.stop="onCardClick(server)">{{ t("btn.edit") }}</el-button>
            </template>
          </el-card>
        </div>
      </el-col>
    </el-row>
    <el-dialog v-bind="dlgProps" v-on="dlgEvent">
      <div class="px-1rem flex-1">
        <Form ref="form" :data="currentServer"></Form>
        <div class="flex gap1rem justify-end">
          <Button type="primary" @click="dlg.save">{{ t("btn.save") }}</Button>
          <el-button @click="dlg.close">{{ t("btn.close") }}</el-button>
        </div>
      </div>
    </el-dialog>
  </ContentLayout>
</template>
