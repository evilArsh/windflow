<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import Config from "./config.vue"
import useMcpStore from "@renderer/store/mcp.store"
import { MCPStdioServer } from "@renderer/types"
const { servers } = useMcpStore()
import ITerminal from "~icons/material-symbols/terminal"
const currentServer = ref<MCPStdioServer>()
const onCardClick = (current: MCPStdioServer) => {
  currentServer.value = current
}
</script>
<template>
  <SubNavLayout id="mcp.subNav">
    <template #submenu>
      <el-scrollbar>
        <el-tree class="mcp-tree" highlight-current node-key="name" :data="servers">
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
      <Config v-if="currentServer" v-model="currentServer"></Config>
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.mcp-tree {
  --el-tree-node-content-height: 4rem;
}
.mcp-tree-node {
  --mcp-tree-icon-size: 3rem;
  display: flex;
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
  padding: 0.5rem;
  .mcp-tree-icon {
    transition: all 0.3s ease-in-out;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--mcp-tree-icon-size);
    height: var(--mcp-tree-icon-size);
    border-radius: 0.5rem;
    &:hover {
      background-color: rgba(10, 205, 231, 0.2);
    }
  }
  .mcp-tree-label {
    font-size: 14px;
    flex: 1;
    overflow: hidden;
  }
}
</style>
