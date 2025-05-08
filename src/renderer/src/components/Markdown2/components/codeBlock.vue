<script setup lang="ts">
import BlockBase from "./blockBase.vue"
defineProps<{
  code?: string
  lang?: string
  html?: string
}>()
</script>
<template>
  <BlockBase :lang :code :html>
    <div v-html="html"></div>
  </BlockBase>
</template>
