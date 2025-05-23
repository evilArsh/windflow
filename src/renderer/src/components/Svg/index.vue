<script setup lang="ts">
defineProps<{
  src?: string
}>()
</script>
<template>
  <i class="svg-box" v-if="src" v-html="src"></i>
  <i-twemoji:exclamation-question-mark class="svg-box" v-else></i-twemoji:exclamation-question-mark>
</template>
<style lang="scss">
.svg-box {
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    flex: 1;
    width: 100%;
    height: 100%;
  }
}
</style>
