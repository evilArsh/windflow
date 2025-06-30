<script lang="ts" setup>
import I18n from "./i18n.vue"
import { NavPage, SettingKeys } from "@renderer/types"
import { useI18n } from "vue-i18n"
import IMdiChatProcessing from "~icons/mdi/chat-processing"
import ICardGiftcard from "~icons/ic/round-card-giftcard"
import ITerminal from "~icons/material-symbols/terminal"
import useI18nWatch from "@renderer/usable/useI18nWatch"
import useSettingsStore from "@renderer/store/settings"
const { t } = useI18n()
const route = useRoute()
const settingsStore = useSettingsStore()
const menuEv = {
  onSelect: (key: string) => {
    defaultRoute.value = key
  },
}
const status = reactive({
  dark: false,
  setTheme: () => {
    if (status.dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  },
  toggleDark: () => {
    status.dark = !status.dark
  },
})
const defaultRoute = ref("")
const pageNav = shallowRef<NavPage[]>([])
useI18nWatch(() => {
  pageNav.value = [
    {
      index: "/main/chat",
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
  ]
})
settingsStore.api.dataWatcher<boolean>(SettingKeys.GlobalThemeDark, toRef(status, "dark"), false, status.setTheme)
onBeforeMount(() => {
  const current = pageNav.value.find(v => route.path.startsWith(v.index))
  defaultRoute.value = current?.index ?? "/main/chat"
})
</script>
<template>
  <el-card class="nav-container" body-class="nav-container-body" shadow="never">
    <div class="nav-menu">
      <el-scrollbar>
        <el-menu :default-active="defaultRoute" @select="menuEv.onSelect" router>
          <el-menu-item v-for="item in pageNav" :key="item.index" :index="item.index" :disabled="item.disabled">
            <div class="nav-menu-item">
              <ContentBox
                normal-icon
                class="flex-1"
                :main-style="{ flexDirection: 'column' }"
                background
                still-lock
                :default-lock="defaultRoute == item.index">
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
          <i-ic:baseline-mode-night v-if="status.dark" class="text-1.4rem"></i-ic:baseline-mode-night>
          <i-ic:twotone-light-mode v-else class="text-1.4rem"></i-ic:twotone-light-mode>
        </div>
      </ContentBox>
      <I18n></I18n>
      <ContentBox background>
        <div class="nav-bottom-item">
          <i-mdi:settings class="text-1.4rem"></i-mdi:settings>
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
  border-right: solid 1px var(--nav-container-border-color);
}
</style>
<style lang="scss" scoped>
html.dark {
  .nav-container {
    --nav-container-border-color: #141414;
  }
}
.nav-container {
  --el-menu-base-level-padding: 0;
  --el-menu-horizontal-height: 100%;
  --el-menu-border-color: transparent;
  --el-menu-item-height: auto;
  --el-menu-sub-item-height: auto;
  --el-menu-active-color: transparent;
  --el-menu-hover-bg-color: transparent;
  --nav-container-bg-color: var(--el-card-bg-color);

  --el-card-border-color: transparent;
  --el-card-border-radius: 0;
  --el-card-padding: 0;

  --nav-container-border-color: #d9d9d9;

  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--nav-container-bg-color);
  .nav-menu {
    flex: 1;
    overflow: hidden;
  }
  .nav-menu-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    .nav-menu-item-icon {
      font-size: 1.8rem;
    }
  }
  .nav-bottom {
    padding: 0.5rem 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    .nav-bottom-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>
