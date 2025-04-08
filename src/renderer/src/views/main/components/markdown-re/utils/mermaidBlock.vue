<script setup lang="ts">
import BlockBase from "./blockBase.vue"
defineProps<{
  rootId: string
  code?: string
  lang?: string
  html?: string
}>()
</script>
<template>
  <BlockBase :lang :code :html :root-id>
    <div v-html="code" class="mermaid mermaid-container"></div>
  </BlockBase>
</template>
