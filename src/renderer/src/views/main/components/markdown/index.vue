<script setup lang="ts">
import { marked } from "marked"
import DOMPurify from "dompurify"

const props = defineProps<{
  content: string
}>()
const html = ref("")
const parse = async () => {
  html.value = DOMPurify.sanitize(await marked.parse(props.content))
}
watch(() => props.content, parse, { immediate: true })
</script>
<template>
  <div class="line-height-2.5rem" v-html="html"></div>
</template>
