<script lang="ts" setup></script>
<template>
  <div class="dialog-panel">
    <div v-if="$slots.header" class="dialog-header">
      <slot name="header"></slot>
    </div>
    <div class="dialog-content">
      <el-scrollbar view-style="padding-right:1rem;width:100%;height:100%" wrap-style="width:100%;height:100%">
        <slot></slot>
      </el-scrollbar>
    </div>
    <el-divider v-if="$slots.footer" class="my-.25rem!"></el-divider>
    <div v-if="$slots.footer" class="dialog-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.dialog-panel {
  --panel-padding: 1.2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .dialog-header {
    flex-shrink: 0;
    padding: var(--panel-padding);
  }
  .dialog-content {
    flex: 1;
    overflow: hidden;
    padding: var(--panel-padding);
  }
  .dialog-footer {
    flex-shrink: 0;
    padding: var(--panel-padding);
  }
}
</style>
