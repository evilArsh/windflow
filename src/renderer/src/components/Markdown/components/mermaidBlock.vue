<script setup lang="ts">
import BlockBase from "./blockBase.vue"
defineProps<{
  code?: string
  lang?: string
}>()
</script>

<template>
  <BlockBase :lang :code>
    <div class="mermaid-container">
      <pre>
        <code class="mermaid language-mermaid" v-text="code"></code>
      </pre>
    </div>
  </BlockBase>
</template>
