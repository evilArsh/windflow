<script lang="ts" setup>
defineProps<{
  reverse?: boolean
}>()
</script>
<template>
  <el-card class="msg-bubble" shadow="never">
    <template v-if="$slots.header" #header>
      <div class="bubble-head" :class="{ reverse }">
        <slot name="header"></slot>
      </div>
    </template>
    <div class="bubble-content" :class="{ reverse }">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="bubble-footer" :class="{ reverse }">
      <slot name="footer"></slot>
    </div>
  </el-card>
</template>
<style lang="scss" scoped>
.msg-bubble {
  --el-card-padding: 0;
  .bubble-head {
    display: flex;
    &.reverse {
      flex-direction: row-reverse;
    }
  }
  .bubble-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--ai-gap-base);
    min-width: 0;
    &.reverse {
      flex-direction: row-reverse;
    }
  }
  .bubble-footer {
    display: flex;
    &.reverse {
      flex-direction: row-reverse;
    }
  }
}
</style>
