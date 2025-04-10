<script lang="ts" setup>
import I18n from "./i18n.vue"
import { NavPage } from "@renderer/types"
import { useI18n } from "vue-i18n"
import IMdiChatProcessing from "~icons/mdi/chat-processing"
import ICardGiftcard from "~icons/ic/round-card-giftcard"
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
const pageNav: NavPage[] = [
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
]
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
              <Hover background still-lock :default-lock="defaultRoute == item.index">
                <div class="nav-menu-item-inner">
                  <i class="nav-menu-item-icon">
                    <component :is="item.icon"></component>
                  </i>
                  <el-text style="--el-text-font-size: 1.2rem">{{ item.label }}</el-text>
                </div>
              </Hover>
            </div>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </div>
    <div class="nav-bottom">
      <Hover background>
        <div class="nav-bottom-item" @click="status.toggleDark">
          <i-ic:baseline-mode-night v-if="status.dark" class="text-1.4rem"></i-ic:baseline-mode-night>
          <i-ic:twotone-light-mode v-else class="text-1.4rem"></i-ic:twotone-light-mode>
        </div>
      </Hover>
      <Hover background>
        <div class="nav-bottom-item">
          <I18n></I18n>
        </div>
      </Hover>
      <Hover background>
        <div class="nav-bottom-item">
          <i-mdi:settings class="text-1.4rem"></i-mdi:settings>
        </div>
      </Hover>
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
  --nav-container-nav-menu-item-inner-width: 80%;
  --nav-container-nav-menu-item-inner-height: 80%;

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
    margin: 1rem 0;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .nav-menu-item-icon {
      font-size: 1.8rem;
      color: var(--nav-container-nav-menu-item-icon-color);
    }
    .nav-menu-item-inner {
      border-radius: 0.5rem;
      width: var(--nav-container-nav-menu-item-inner-width);
      height: var(--nav-container-nav-menu-item-inner-height);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      &.horizontal {
        flex-direction: row;
      }
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
      border-radius: 0.5rem;
      margin: 0.1rem;
      padding: 0.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>
