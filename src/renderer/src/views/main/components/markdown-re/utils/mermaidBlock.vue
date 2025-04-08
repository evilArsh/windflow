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
    <div class="mermaid-container">
      <pre>
        <code class="mermaid language-mermaid" v-text="code"></code>
      </pre>
    </div>
  </BlockBase>
</template>
