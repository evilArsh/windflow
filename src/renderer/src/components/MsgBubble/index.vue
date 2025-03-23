<script lang="ts" setup>
const props = defineProps<{
  reverse?: boolean
}>()
</script>
<template>
  <div class="msg-bubble" :class="{ reverse: props.reverse }">
    <div class="bubble-head">
      <slot name="head"></slot>
    </div>
    <div class="bubble-content" :class="{ reverse: props.reverse }">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.msg-bubble {
  --bubble-head-pd: 0.5rem;
  --msg-bubble-border-color: transparent;

  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  border: 1px solid var(--msg-bubble-border-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  &.reverse {
    flex-direction: row-reverse;
  }
  .bubble-head {
    flex-shrink: 0;
    padding: var(--bubble-head-pd);
  }
  .bubble-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    &.reverse {
      flex-direction: row-reverse;
    }
  }
}
</style>
