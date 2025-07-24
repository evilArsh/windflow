<script lang="ts" setup>
import Navbar from "./components/nav/index.vue"
onMounted(() => {})
</script>
<template>
  <div class="main-container">
    <div class="main-aside">
      <Navbar></Navbar>
    </div>
    <div class="content-container">
      <div class="content-main">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.main-container {
  --main-container-main-aside-width: 7rem;
  --main-container-content-header-height: 5rem;
  background-color: var(--el-bg-color-page);
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  // gap: 1rem;
  .main-aside {
    width: var(--main-container-main-aside-width);
    overflow: hidden;
    display: flex;
  }
  .content-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    .content-header {
      height: var(--main-container-content-header-height);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    }
    .content-main {
      flex: 1;
      overflow: hidden;
      display: flex;
    }
  }
}
</style>
