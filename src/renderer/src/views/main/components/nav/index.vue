<script lang="ts" setup>
import I18n from "./i18n.vue"
import { SettingKeys } from "@windflow/core/types"
import { useI18n } from "vue-i18n"
import IMdiChatProcessing from "~icons/mdi/chat-processing"
import ICardGiftcard from "~icons/ic/round-card-giftcard"
import ITerminal from "~icons/material-symbols/terminal"
import IBook from "~icons/material-symbols/book-4-spark"
import useSettingsStore from "@renderer/store/settings"
import { useI18nWatch } from "@toolmain/shared"
import { Theme } from "@windflow/shared"
import { useTask } from "@renderer/hooks/useTask"
import PQueue from "p-queue"
import { NavPage } from "./type"
const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const defaultPath = "/main/chat"

const defaultRoute = ref("")
const task = useTask(new PQueue({ concurrency: 1 }))
const pageNav = shallowRef<NavPage[]>([])
useI18nWatch(() => {
  pageNav.value = [
    {
      index: defaultPath,
      label: t("nav.chat"),
      icon: h(IMdiChatProcessing),
    },
    {
      index: "/main/model",
      label: t("nav.modelSetting"),
      icon: h(ICardGiftcard),
    },
    {
      index: "/main/mcp",
      label: t("nav.mcp"),
      icon: h(ITerminal),
    },
    {
      index: "/main/knowledge",
      label: t("nav.knowledge"),
      icon: h(IBook),
    },
  ]
})
const menuEv = {
  onSelect: (path: string) => {
    if (task.pending()) return
    task.getQueue().add(async () => {
      if (path.startsWith(defaultRoute.value) && defaultRoute.value) return
      const current = pageNav.value.find(v => path.startsWith(v.index))
      defaultRoute.value = current?.index ?? defaultPath
      menuEv.onRouteChange(path)
    })
  },
  onRouteChange(path: string) {
    router.replace({
      path,
    })
  },
}
const useStatus = () => {
  const dark = ref(false)
  function setTheme(dark: boolean) {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }
  function toggleDark() {
    dark.value = !dark.value
    window.api.theme.setTheme(dark.value ? Theme.dark : Theme.light)
  }
  return { dark, setTheme, toggleDark }
}
const status = useStatus()

settingsStore.dataWatcher<boolean>(SettingKeys.GlobalThemeDark, toRef(status, "dark"), false, status.setTheme)
settingsStore.dataWatcher<string>(SettingKeys.DefaultRoute, defaultRoute, "/main/chat", (path, old) => {
  if (old && path.startsWith(old)) return
  menuEv.onRouteChange(path)
})
</script>
<template>
  <el-card class="nav-container" body-class="nav-container-body" shadow="never">
    <div class="nav-menu">
      <el-scrollbar>
        <el-menu style="--el-menu-bg-color: transparent" :default-active="defaultRoute" @select="menuEv.onSelect">
          <el-menu-item v-for="item in pageNav" :key="item.index" :index="item.index" :disabled="item.disabled">
            <div class="nav-menu-item">
              <ContentBox
                normal-icon
                class="flex-1"
                style="--box-padding: 0 var(--ai-gap-base)"
                :main-style="{ flexDirection: 'column' }"
                background
                still-lock
                :default-lock="defaultRoute.startsWith(item.index)">
                <template #icon>
                  <i class="nav-menu-item-icon"><component :is="item.icon"></component></i>
                </template>
                <el-text size="small">{{ item.label }}</el-text>
              </ContentBox>
            </div>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </div>
    <div class="nav-bottom">
      <ContentBox background @click="status.toggleDark">
        <div class="nav-bottom-item">
          <i-ic-baseline-mode-night v-if="toValue(status.dark)" class="text-1.4rem"></i-ic-baseline-mode-night>
          <i-ic-twotone-light-mode v-else class="text-1.4rem"></i-ic-twotone-light-mode>
        </div>
      </ContentBox>
      <I18n></I18n>
      <ContentBox background>
        <div class="nav-bottom-item">
          <i-mdi-settings class="text-1.4rem"></i-mdi-settings>
        </div>
      </ContentBox>
    </div>
  </el-card>
</template>
<style lang="scss">
.nav-container-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
<style lang="scss" scoped>
.nav-container {
  --el-menu-base-level-padding: 0;
  --el-menu-horizontal-height: 100%;
  --el-menu-border-color: transparent;
  --el-menu-item-height: auto;
  --el-menu-sub-item-height: auto;
  --el-menu-active-color: transparent;
  --el-menu-hover-bg-color: transparent;
  --el-card-border-color: transparent;
  --el-card-border-radius: 0;
  --el-card-padding: 0;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  margin: var(--ai-gap-base);
  -webkit-app-region: drag;
  .nav-menu {
    flex: 1;
    overflow: hidden;
  }
  .nav-menu-item {
    -webkit-app-region: no-drag;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 var(--ai-gap-base) 0;
    cursor: pointer;
    .nav-menu-item-icon {
      font-size: 1.8rem;
    }
  }
  .nav-bottom {
    -webkit-app-region: no-drag;
    padding: 0.5rem 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ai-gap-base);
    align-items: center;
    .nav-bottom-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>
