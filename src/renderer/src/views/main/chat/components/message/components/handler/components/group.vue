<script setup lang="ts">
import Divider from "./divider.vue"
const spacer = h(Divider)
</script>
<template>
  <el-space :size="5" :spacer wrap fill class="w-full">
    <slot></slot>
  </el-space>
</template>
<style lang="scss" scoped></style>
