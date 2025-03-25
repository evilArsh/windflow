<script setup lang="ts">
defineProps<{
  src: string
}>()
</script>
<template>
  <span class="inline-block flex items-center justify-center" v-html="src"> </span>
</template>
