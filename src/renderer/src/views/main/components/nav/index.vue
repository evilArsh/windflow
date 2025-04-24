<script lang="ts" setup>
import I18n from "./i18n.vue"
import { NavPage } from "@renderer/types"
import { useI18n } from "vue-i18n"
import IMdiChatProcessing from "~icons/mdi/chat-processing"
import ICardGiftcard from "~icons/ic/round-card-giftcard"
import ITerminal from "~icons/material-symbols/terminal"
import useI18nWatch from "@renderer/usable/useI18nWatch"
const { t } = useI18n()
const route = useRoute()
const menuEv = {
  onSelect: (key: string) => {
    defaultRoute.value = key
  },
}
const status = reactive({
  dark: false,
  toggleDark: () => {
    status.dark = !status.dark
    document.documentElement.classList.toggle("dark", status.dark)
  },
})
const defaultRoute = ref("/main/chat")
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
onMounted(() => {
  defaultRoute.value = route.path
})
</script>
<template>
  <div class="nav-container el-card">
    <div class="nav-menu">
      <el-scrollbar>
        <el-menu :default-active="defaultRoute" @select="menuEv.onSelect" router>
          <el-menu-item v-for="item in pageNav" :key="item.index" :index="item.index" :disabled="item.disabled">
            <div class="nav-menu-item">
              <ContentBox
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
      <ContentBox background>
        <div class="nav-bottom-item" @click="status.toggleDark">
          <i-ic:baseline-mode-night v-if="status.dark" class="text-1.4rem"></i-ic:baseline-mode-night>
          <i-ic:twotone-light-mode v-else class="text-1.4rem"></i-ic:twotone-light-mode>
        </div>
      </ContentBox>
      <ContentBox background>
        <div class="nav-bottom-item">
          <I18n></I18n>
        </div>
      </ContentBox>
      <ContentBox background>
        <div class="nav-bottom-item">
          <i-mdi:settings class="text-1.4rem"></i-mdi:settings>
        </div>
      </ContentBox>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nav-container {
  --el-menu-base-level-padding: 0;
  --el-menu-horizontal-height: 100%;
  --el-menu-border-color: transparent;
  --el-menu-item-height: auto;
  --el-menu-sub-item-height: auto;
  --el-menu-active-color: transparent;
  --el-menu-hover-bg-color: transparent;
  --nav-container-nav-menu-item-icon-color: #333;
  --nav-container-bg-color: var(--el-card-bg-color);

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
    margin: 0.5rem;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    .nav-menu-item-icon {
      font-size: 1.8rem;
      color: var(--nav-container-nav-menu-item-icon-color);
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
