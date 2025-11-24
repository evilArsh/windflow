<script lang="ts" setup>
import ContentBox from "@renderer/components/ContentBox/index.vue"
import useSettingsStore from "@renderer/store/settings"
import ITerminal from "~icons/material-symbols/terminal"
import IGlobe from "~icons/material-symbols/globe"
import IDisplaySettingsOutline from "~icons/material-symbols/display-settings-outline"
import { type Component } from "vue"
import { SettingKeys } from "@renderer/types"
import { useI18nWatch, useShortcut } from "@toolmain/shared"
const { t } = useI18n()

const shortcut = useShortcut()
const settingsStore = useSettingsStore()
const currentRoute = ref("")
const router = useRouter()
const route = useRoute()
const menus = shallowRef<{ icon: Component; title: string; path: string }[]>([])
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
const cache = reactive({
  showSubNav: true,
})
const ev = {
  toggleNav(_?: MouseEvent) {
    cache.showSubNav = !cache.showSubNav
  },
}
settingsStore.dataWatcher<string>(SettingKeys.MCPSubRoute, currentRoute, route.path, path => {
  router.push(path)
})
settingsStore.dataWatcher<boolean>(SettingKeys.MCPToggleSubNav, toRef(cache, "showSubNav"), true)
shortcut.listen("ctrl+b", res => {
  res && ev.toggleNav()
})
</script>
<template>
  <SubNavLayout :id="SettingKeys.MCPSubNav" :hide-submenu="!cache.showSubNav">
    <template #submenu>
      <el-scrollbar>
        <div class="flex flex-col p1rem">
          <div class="mb-1rem">
            <ContentBox normal>
              <el-text class="text-2.6rem! font-600">{{ t("mcp.title") }}</el-text>
              <template #end>
                <teleport to="#mainContentHeaderSlot" defer :disabled="cache.showSubNav">
                  <ContentBox @click="ev.toggleNav" background>
                    <i-material-symbols-right-panel-close-outline
                      class="text-1.6rem"
                      v-if="!cache.showSubNav"></i-material-symbols-right-panel-close-outline>
                    <i-material-symbols-left-panel-close-outline
                      class="text-1.6rem"
                      v-else></i-material-symbols-left-panel-close-outline>
                  </ContentBox>
                </teleport>
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
              :background="false"
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
