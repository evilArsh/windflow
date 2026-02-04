<script lang="ts" setup>
defineProps<{
  reverse?: boolean
}>()
</script>
<template>
  <div class="msg-bubble-container" :class="{ reverse }">
    <div class="msg-bubble-icon">
      <slot name="icon"></slot>
    </div>
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
  </div>
</template>
<style lang="scss" scoped>
.msg-bubble-container {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--ai-gap-base);
  align-self: flex-start;
  &.reverse {
    flex-direction: row-reverse;
    align-self: flex-end;
  }
  .msg-bubble-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .msg-bubble {
    --el-card-padding: 0;
    --el-card-border-radius: var(--ai-gap-medium);
    flex: 1;
    .bubble-head {
      display: flex;
      &.reverse {
        flex-direction: row-reverse;
      }
    }
    .bubble-content {
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
}
</style>
