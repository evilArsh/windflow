<script setup lang="ts">
import BlockBase from "./blockBase.vue"
import type { Element } from "hast"
import { getLang } from "../worker/utils"
const props = defineProps<{
  children?: unknown
  node?: Element
}>()
const html = ref("")
const code = ref("")
const lang = ref("")
watchEffect(() => {
  console.log("[props]", props)
  lang.value = getLang(props.node)
  if (isString(props.children)) {
    code.value = props.children
    if (lang.value) {
      html.value = `<pre><code>${props.children}</code></pre>`
    } else {
      html.value = `<pre><code>${props.children}</code></pre>`
    }
  }
})
</script>
<template>
  <BlockBase :code :lang>
    <div class="hljs" v-html="html"></div>
  </BlockBase>
</template>
