<script lang="ts" setup>
import ContentBox from "@renderer/components/ContentBox/index.vue"
import useSettingsStore from "@renderer/store/settings"
import ITerminal from "~icons/material-symbols/terminal"
import IGlobe from "~icons/material-symbols/globe"
import IDisplaySettingsOutline from "~icons/material-symbols/display-settings-outline"
import { type Component } from "vue"
import { SettingKeys } from "@windflow/core/types"
import { useI18nWatch } from "@toolmain/shared"
import { useShortcutBind } from "@renderer/hooks/useShortcutBind"
const { t } = useI18n()
const settingsStore = useSettingsStore()
const router = useRouter()
const route = useRoute()
const menus = shallowRef<{ icon: Component; title: string; path: string }[]>([])
const { data: currentRoute } = settingsStore.dataWatcher<string>(SettingKeys.MCPSubRoute, null, route.path, path => {
  router.push(path)
})
const { data: showSubNav } = settingsStore.dataWatcher<boolean>(SettingKeys.MCPToggleSubNav, null, true)
const routes = {
  toPath: (path: string) => {
    currentRoute.value = path
  },
}
useI18nWatch(() => {
  menus.value = [
    { icon: ITerminal, title: t("mcp.menu.servers"), path: "/main/mcp/index" },
    { icon: IGlobe, title: t("mcp.menu.market"), path: "/main/mcp/market" },
    { icon: IDisplaySettingsOutline, title: t("mcp.menu.env"), path: "/main/mcp/exec" },
  ]
})
useShortcutBind(SettingKeys.SidebarToggleShortcut, res => {
  if (!res) return
  showSubNav.value = !showSubNav.value
})
</script>
<template>
  <SubNavLayout :id="SettingKeys.MCPSubNav" :hide-submenu="!showSubNav">
    <template #submenu>
      <el-scrollbar>
        <div class="flex flex-col p1rem">
          <div class="mb-1rem">
            <ContentBox normal>
              <el-text class="text-2.6rem! font-600">{{ t("mcp.title") }}</el-text>
              <template #end>
                <SidebarToggle
                  v-model="showSubNav"
                  to="#mainContentHeaderSlot"
                  defer
                  :disabled="showSubNav"></SidebarToggle>
              </template>
              <template #footer>
                <el-text type="info">{{ t("mcp.subTitle") }}</el-text>
              </template>
            </ContentBox>
          </div>
          <div class="flex flex-col gap-1rem">
            <ContentBox
              v-for="menu in menus"
              :key="menu.path"
              :default-lock="currentRoute == menu.path"
              still-lock
              @click="routes.toPath(menu.path)">
              <template #icon><component :is="menu.icon"></component></template>
              <el-text>{{ menu.title }}</el-text>
            </ContentBox>
          </div>
        </div>
      </el-scrollbar>
    </template>
    <template #content>
      <router-view></router-view>
    </template>
  </SubNavLayout>
</template>
