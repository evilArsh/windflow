<script setup lang="ts">
defineProps<{
  src?: string
}>()
</script>
<template>
  <i class="svg-box inline-block flex items-center justify-center">
    <i v-if="src" v-html="src"></i>
    <i-twemoji:exclamation-question-mark v-else></i-twemoji:exclamation-question-mark>
  </i>
</template>
<style lang="scss">
.svg-box {
  svg {
    width: 100%;
    height: 100%;
  }
}
</style>
