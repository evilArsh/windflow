<script setup lang="ts">
import { useClipboard } from "@vueuse/core"
const props = defineProps<{
  rootId: string
  code?: string
  lang?: string
  html?: string
}>()
const { copy } = useClipboard()
const copied = ref(false)
async function onCopy() {
  try {
    if (copied.value) return
    await copy(props.code ?? "")
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
    <el-card class="code-block" shadow="never">
      <template #header>
        <div class="code-block-header">
          <el-tag type="primary">{{ lang || "plaintext" }}</el-tag>
          <el-button type="primary" @click="onCopy" size="small" round plain circle>
            <i-ic:outline-check v-if="copied"></i-ic:outline-check>
            <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
          </el-button>
        </div>
      </template>
      <slot></slot>
    </el-card>
  </div>
</template>
