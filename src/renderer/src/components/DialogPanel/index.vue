<script lang="ts" setup></script>
<template>
  <el-card
    class="dialog-panel"
    header-class="flex-shrink-0"
    footer-class="flex-shrink-0"
    body-class="flex-1 overflow-hidden flex p0!"
    shadow="never"
    style="--el-card-padding: 1rem">
    <template v-if="$slots.header" #header>
      <slot name="header"></slot>
    </template>
    <el-scrollbar class="flex-1" view-class="p-10px h-full">
      <slot></slot>
    </el-scrollbar>
    <template v-if="$slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </el-card>
</template>
<style lang="scss" scoped>
.dialog-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
