<script setup lang="ts">
defineProps<{
  src?: string
}>()
</script>
<template>
  <i class="svg-box inline-block" v-if="src" v-html="src"></i>
  <i-twemoji:exclamation-question-mark class="svg-box inline-block" v-else></i-twemoji:exclamation-question-mark>
</template>
<style lang="scss">
.svg-box {
  svg {
    width: 100%;
    height: 100%;
  }
}
</style>
