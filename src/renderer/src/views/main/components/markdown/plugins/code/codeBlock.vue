<script setup lang="ts">
import { useClipboard } from "@vueuse/core"
const props = defineProps<{
  code: string
  content: string
  lang: string
}>()

const { copy } = useClipboard({ source: props.code })
const copied = ref(false)
async function onCopy() {
  try {
    await copy()
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (_) {
    copied.value = false
  }
}
</script>
<template>
  <div>
    <el-card class="code-block" shadow="hover">
      <template #header>
        <div class="code-block-header">
          <el-text type="primary">{{ lang }}</el-text>
          <el-button type="primary" @click="onCopy" size="small" round plain circle>
            <i-ic:outline-check v-if="copied"></i-ic:outline-check>
            <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
          </el-button>
        </div>
      </template>
      <pre>
        <code :class="`hljs language-${lang}`" v-html="content"></code>
      </pre>
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
</style>
