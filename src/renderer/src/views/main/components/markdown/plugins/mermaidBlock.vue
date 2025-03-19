<script setup lang="ts">
import "highlight.js/styles/github-dark.css"
import mermaid from "mermaid"
const props = defineProps<{
  partial?: boolean
  code?: string
  lang?: string
}>()

async function renderMermaid() {
  if (!props.partial) {
    await nextTick()
    mermaid.run()
  }
}
watchEffect(() => {
  renderMermaid()
})
</script>
<template>
  <div>
    <el-card class="code-block" shadow="hover">
      <template #header>
        <div class="code-block-header">
          <el-tag type="primary">{{ lang }}</el-tag>
        </div>
      </template>
      <div class="mermaid-container">
        <pre class="mermaid" v-html="code"></pre>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.code-block {
  --el-card-padding: 1rem;
  border: solid 1px #dce0e5;
  border-radius: 0.5rem;
}
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.code-block-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mermaid-container {
  display: block !important;
  max-width: 100%;
  overflow: auto;
}
</style>
