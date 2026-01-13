<script lang="ts" setup>
import Navbar from "./components/nav/index.vue"
import Debugger from "./components/debugger/index.vue"
import AutoUpdate from "./components/autoUpdate/index.vue"
onMounted(() => {})
</script>
<template>
  <div class="main-container">
    <div class="main-content-header">
      <div class="flex-shrink-0 flex-y-center gap-1rem justify-start">
        <div id="mainContentHeaderSlot"></div>
      </div>
      <div class="flex-1"></div>
      <div class="flex-shrink-0 flex-y-center gap-1rem">
        <AutoUpdate></AutoUpdate>
        <Debugger></Debugger>
      </div>
    </div>
    <div class="main-content">
      <div class="main-aside">
        <Navbar></Navbar>
      </div>
      <div class="main-content-inner">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.main-container {
  background-color: var(--el-bg-color-page);
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .main-aside {
    overflow: hidden;
    display: flex;
  }
  .main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    // flex-direction: column;
    // gap: var(--ai-gap-base);
  }
  .main-content-header {
    -webkit-app-region: drag;
    height: var(--ai-header-height);
    padding: 0 140px 0 var(--ai-gap-base);
    background-color: var(--el-bg-color);
    border-bottom-left-radius: var(--el-border-radius-base);
    display: flex;
    align-items: center;
    position: relative;
    z-index: 99999;
  }
  .main-content-inner {
    flex: 1;
    overflow: hidden;
    display: flex;
    padding: var(--ai-gap-base) var(--ai-gap-base) var(--ai-gap-base) 0;
    border-radius: var(--el-border-radius-base);
  }
}
</style>
