<script setup lang="ts">
import BlockBase from "./blockBase.vue"
import hljs from "highlight.js"
const props = defineProps<{
  code?: string
  lang?: string
}>()
const codeSlot = useTemplateRef("codeSlot")
const html = ref("")
watchEffect(() => {
  if (codeSlot.value && props.code && props.lang) {
    html.value = hljs.highlight(props.code, { language: props.lang }).value
  }
})
</script>
<template>
  <BlockBase :lang :code>
    <div class="hljs" ref="codeSlot" v-html="html"></div>
  </BlockBase>
</template>
