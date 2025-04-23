<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import Config from "./config.vue"
import useMcpStore from "@renderer/store/mcp.store"
import { MCPStdioServer } from "@renderer/types"
import ITerminal from "~icons/material-symbols/terminal"
import { storeToRefs } from "pinia"
import useDialog from "@renderer/usable/useDialog"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import { cloneDeep } from "lodash"
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
const currentServer = ref<MCPStdioServer>()
const onCardClick = (current: MCPStdioServer) => {
  currentServer.value = current
}
const onCurrentChange = (data: MCPStdioServer) => {
  currentServer.value && Object.assign(currentServer.value, data)
}
const onAdd = (data: MCPStdioServer) => {
  servers.value.push(cloneDeep(data))
  close()
}
</script>
<template>
  <SubNavLayout id="mcp.subNav">
    <template #submenu>
      <el-scrollbar>
        <el-tree
          class="mcp-tree"
          :current-node-key="currentServer?.serverName"
          highlight-current
          node-key="name"
          :data="servers">
          <template #default="{ data }: { data: MCPStdioServer }">
            <div class="mcp-tree-node" @click.stop="onCardClick(data)">
              <el-button text size="small" circle>
                <div class="mcp-tree-icon">
                  <ITerminal class="text-2rem"></ITerminal>
                  <!-- <Svg :src="data.logo" class="text-2rem"></Svg> -->
                </div>
              </el-button>
              <el-text class="mcp-tree-label" line-clamp="2">{{ data.serverName }}</el-text>
            </div>
          </template>
        </el-tree>
      </el-scrollbar>
    </template>
    <template #content>
      <ContentLayout>
        <template #header>
          <div class="p-1rem flex-1 flex flex-col">
            <div>
              <el-button type="primary" size="small" @click="open">{{ t("btn.new") }}</el-button>
            </div>
            <el-divider class="my-1rem!"></el-divider>
          </div>
        </template>
        <Config v-if="currentServer" mode="edit" :data="currentServer" @change="onCurrentChange"></Config>
      </ContentLayout>
    </template>
  </SubNavLayout>
  <el-dialog v-bind="dlgProps" v-on="dlgEvent" :title="t('mcp.add')">
    <Config mode="add" @change="onAdd">
      <el-button @click="close">{{ t("btn.close") }}</el-button>
    </Config>
  </el-dialog>
</template>
