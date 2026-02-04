<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import IBook from "~icons/material-symbols/book-4"
import IBookmark from "~icons/material-symbols/bookmark-stacks"
import { type Component } from "vue"
import { SettingKeys } from "@windflow/core/types"
import { useI18nWatch } from "@toolmain/shared"
import { useShortcutBind } from "@renderer/hooks/useShortcutBind"
const { t } = useI18n()

const settingsStore = useSettingsStore()

const router = useRouter()
const route = useRoute()
const menus = shallowRef<{ icon: Component; title: string; path: string }[]>([])
const { data: currentRoute } = settingsStore.dataWatcher<string>(
  SettingKeys.KnowledgeSubRoute,
  null,
  route.path,
  path => {
    path && router.push(path)
  }
)
const { data: showSubNav } = settingsStore.dataWatcher<boolean>(SettingKeys.KnowledgeToggleSubNav, null, true)
const routes = {
  toPath: (path: string) => {
    currentRoute.value = path
  },
}
useI18nWatch(() => {
  menus.value = [
    { icon: IBook, title: t("knowledge.menu.list"), path: "/main/knowledge/index" },
    { icon: IBookmark, title: t("knowledge.menu.embeddingList"), path: "/main/knowledge/embedding" },
  ]
})
useShortcutBind(SettingKeys.SidebarToggleShortcut, res => {
  if (!res) return
  showSubNav.value = !showSubNav.value
})
router.afterEach(to => {
  menus.value.find(m => m.path == to.path) && routes.toPath(to.path)
})
</script>
<template>
  <SubNavLayout :id="SettingKeys.KnowledgeSubNav" :hide-submenu="!showSubNav">
    <template #submenu>
      <el-scrollbar>
        <div class="flex flex-col p1rem">
          <div class="mb-1rem">
            <ContentBox normal>
              <el-text class="text-2.6rem! font-600">{{ t("knowledge.title") }}</el-text>
              <template #end>
                <SidebarToggle
                  v-model="showSubNav"
                  to="#mainContentHeaderSlot"
                  defer
                  :disabled="showSubNav"></SidebarToggle>
              </template>
              <template #footer>
                <el-text type="info">{{ t("knowledge.subTitle") }}</el-text>
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
