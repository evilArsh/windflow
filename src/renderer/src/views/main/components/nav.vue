<template>
  <div class="nav-container">
    <div class="nav-menu">
      <el-scrollbar>
        <el-menu :default-active="defaultRoute" @select="event.onSelect" router>
          <el-menu-item v-for="item in page" :key="item.index" :index="item.index" :disabled="item.disabled">
            <div class="nav-menu-item">
              <Hover background still-lock :default-lock="defaultRoute == item.index">
                <div class="nav-menu-item-inner">
                  <i class="nav-menu-item-icon">
                    <component :is="item.icon"></component>
                  </i>
                  <el-text class="nav-menu-item-text">{{ item.label }}</el-text>
                </div>
              </Hover>
            </div>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </div>
    <div class="nav-bottom">
      <Hover background>
        <div class="nav-bottom-item">
          <i-mdi:settings class="text-1.8rem"></i-mdi:settings>
        </div>
      </Hover>
    </div>
  </div>
</template>

<script lang="ts" setup>
import navStore from "@renderer/pinia/nav.store"
import { storeToRefs } from "pinia"
const { page, defaultRoute } = storeToRefs(navStore())
const route = useRoute()
const event = {
  onSelect: (key: string) => {
    defaultRoute.value = key
  },
}

onMounted(() => {
  defaultRoute.value = route.path
})
</script>

<style lang="scss" scoped>
.nav-container {
  --el-menu-base-level-padding: 0;
  --el-menu-horizontal-height: 100%;
  --el-menu-border-color: transparent;
  --el-menu-item-height: auto;
  --el-menu-sub-item-height: auto;
  --el-menu-active-color: transparent;
  --el-menu-hover-bg-color: transparent;
  --nav-container-icon-color: #333;
  --nav-container-bg-color: #fff;

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
      color: var(--nav-container-icon-color);
    }
    .nav-menu-item-inner {
      border-radius: 0.5rem;
      width: 80%;
      height: 80%;
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
      margin: 0.5rem;
      padding: 0.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>
