<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import IBook from "~icons/material-symbols/book-4"
import IBookmark from "~icons/material-symbols/bookmark-stacks"
import { type Component } from "vue"
import { SettingKeys } from "@renderer/types"
import { useI18nWatch, useShortcut } from "@toolmain/shared"
const { t } = useI18n()

const settingsStore = useSettingsStore()

const shortcut = useShortcut()
const currentRoute = ref("")
const router = useRouter()
const route = useRoute()
const menus = shallowRef<{ icon: Component; title: string; path: string }[]>([])
const routes = {
  toPath: (path: string) => {
    currentRoute.value = path
    router.push(path)
  },
}
useI18nWatch(() => {
  menus.value = [
    { icon: IBook, title: t("knowledge.menu.list"), path: "/main/knowledge/index" },
    { icon: IBookmark, title: t("knowledge.menu.embeddingList"), path: "/main/knowledge/embedding" },
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
settingsStore.dataWatcher<string>(SettingKeys.KnowledgeSubRoute, currentRoute, route.fullPath, path => {
  router.push(path)
})
settingsStore.dataWatcher<boolean>(SettingKeys.KnowledgeToggleSubNav, toRef(cache, "showSubNav"), true)
shortcut.listen("ctrl+b", res => {
  res && ev.toggleNav()
})
</script>
<template>
  <SubNavLayout :id="SettingKeys.KnowledgeSubNav" :hide-submenu="!cache.showSubNav">
    <template #submenu>
      <el-scrollbar>
        <div class="flex flex-col p1rem">
          <div class="mb-1rem">
            <ContentBox normal>
              <el-text class="text-2.6rem! font-600">{{ t("knowledge.title") }}</el-text>
              <template #end>
                <teleport to="#mainContentHeaderSlot" defer :disabled="cache.showSubNav">
                  <ContentBox @click="ev.toggleNav" background>
                    <i-material-symbols:right-panel-close-outline
                      class="text-1.6rem"
                      v-if="!cache.showSubNav"></i-material-symbols:right-panel-close-outline>
                    <i-material-symbols:left-panel-close-outline
                      class="text-1.6rem"
                      v-else></i-material-symbols:left-panel-close-outline>
                  </ContentBox>
                </teleport>
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
