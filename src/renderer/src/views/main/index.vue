<script lang="ts" setup>
import Navbar from "./components/nav/index.vue"
import Debugger from "./components/debugger/index.vue"
onMounted(() => {})
</script>
<template>
  <div class="main-container">
    <div class="main-aside">
      <Navbar></Navbar>
    </div>
    <div class="main-content">
      <div class="main-content-header">
        <div class="flex items-center gap-1rem justify-start">
          <div id="mainContentHeaderSlot"></div>
        </div>
        <Debugger></Debugger>
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
  .main-aside {
    overflow: hidden;
    display: flex;
  }
  .main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--ai-gap-base);
  }
  .main-content-header {
    -webkit-app-region: drag;
    height: var(--ai-header-height);
    padding: 0 140px 0 var(--ai-gap-base);
    background-color: var(--el-bg-color);
    border-bottom-left-radius: var(--el-border-radius-base);
    display: flex;
    align-items: center;
  }
  .main-content-inner {
    flex: 1;
    overflow: hidden;
    display: flex;
    margin: 0 var(--ai-gap-base) var(--ai-gap-base) 0;
    border-radius: var(--el-border-radius-base);
  }
}
</style>
