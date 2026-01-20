<script setup lang="ts">
import type { Element } from "hast"
import { ExtraProps, getLang } from "@windflow/markdown"
import { isUndefined } from "@toolmain/shared"
import Code from "./code.vue"
import RawCode from "./rawCode.vue"
const props = defineProps<{
  children?: string
  node?: Element
  extraProps?: ExtraProps
}>()
const code = ref("")
const lang = ref("")
const vnode = shallowRef<VNode>()
watchEffect(() => {
  if (!props.node) return
  if (isUndefined(props.children)) return
  lang.value = getLang(props.node)
  code.value = props.children

  if (lang.value) {
    vnode.value = h(Code, {
      lang: lang.value,
      code: code.value,
      forcePlaintext: !!props.extraProps?.forcePlaintext,
    })
  } else {
    vnode.value = h(RawCode, {
      lang: lang.value,
      code: code.value,
    })
  }
})
</script>
<template>
  <component :is="vnode"></component>
</template>
