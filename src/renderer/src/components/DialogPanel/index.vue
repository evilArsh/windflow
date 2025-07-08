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
    <div class="flex-1 overflow-hidden">
      <el-scrollbar view-style="padding:10px">
        <slot></slot>
      </el-scrollbar>
    </div>
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
