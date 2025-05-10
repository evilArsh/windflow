<script setup lang="ts">
import { useShiki } from "@renderer/usable/useShiki"
const props = defineProps<{
  code: string
  lang: string
}>()
const { codeToHtml } = useShiki()
const html = ref("")
const codeWithMultiLine = computed(() => /\r\n|\n|\r/g.test(props.code))
watchEffect(() => {
  if (codeWithMultiLine.value) {
    codeToHtml(props.code, "plaintext").then(res => {
      html.value = res
    })
  }
})
</script>
<template>
  <div v-if="codeWithMultiLine" v-html="html"></div>
  <el-tag effect="light" v-else>{{ code }}</el-tag>
</template>
