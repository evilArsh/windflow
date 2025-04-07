<script setup lang="ts">
defineProps<{
  src: string
}>()
</script>
<template>
  <span class="svg-box inline-block flex items-center justify-center" v-html="src"> </span>
</template>
<style lang="scss">
.svg-box {
  svg {
    width: 100%;
    height: 100%;
  }
}
</style>
