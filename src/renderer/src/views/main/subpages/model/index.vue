<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import Provider from "./components/provider.vue"
import Setting from "./components/setting.vue"
</script>
<template>
  <SubNavLayout>
    <template #submenu>
      <el-scrollbar>
        <Provider></Provider>
      </el-scrollbar>
    </template>
    <template #content>
      <Setting></Setting>
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped></style>
