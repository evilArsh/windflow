<script lang="ts" setup>
import ContentBox from "@renderer/components/ContentBox/index.vue"
import ITerminal from "~icons/material-symbols/terminal"
import IGlobe from "~icons/material-symbols/globe"
import IDisplaySettingsOutline from "~icons/material-symbols/display-settings-outline"
import useI18nWatch from "@renderer/usable/useI18nWatch"
import { type Component } from "vue"

const currentRoute = ref("")
const router = useRouter()
const route = useRoute()
const menus = shallowRef<{ icon: Component; title: string; path: string }[]>([])
function toPath(path: string) {
  currentRoute.value = path
  router.push(path)
}
useI18nWatch(() => {
  menus.value = [
    { icon: ITerminal, title: "服务列表", path: "servers" },
    { icon: IGlobe, title: "发现", path: "market" },
    { icon: IDisplaySettingsOutline, title: "环境配置", path: "exec" },
  ]
})
onMounted(() => {
  const path = route.path
  toPath(path.slice(path.lastIndexOf("/") + 1))
})
</script>
<template>
  <SubNavLayout id="mcp.subNav">
    <template #submenu>
      <el-scrollbar>
        <el-card style="--el-card-padding: 1rem" shadow="never">
          <div class="flex flex-col">
            <div class="my-2.4rem">
              <ContentBox normal background>
                <el-text class="text-2.6rem! font-600">MCP</el-text>
                <template #footer>
                  <el-text type="info">MCP服务配置</el-text>
                </template>
              </ContentBox>
            </div>
            <div class="flex flex-col gap-1rem">
              <ContentBox
                v-for="menu in menus"
                :key="menu.path"
                :default-lock="currentRoute == menu.path"
                still-lock
                :background="false"
                @click="toPath(menu.path)">
                <template #icon><component :is="menu.icon"></component></template>
                <el-text type="info">{{ menu.title }}</el-text>
              </ContentBox>
            </div>
          </div>
        </el-card>
      </el-scrollbar>
    </template>
    <template #content>
      <router-view></router-view>
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
