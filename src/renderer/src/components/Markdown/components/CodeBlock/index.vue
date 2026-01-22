<script setup lang="ts">
import type { Element } from "hast"
import { ExtraProps, getLang } from "@windflow/markdown"
import { isUndefined } from "@toolmain/shared"
import Code from "./code.vue"
import RawCode from "./rawCode.vue"
import { cloneVNode } from "vue"
const props = defineProps<{
  children?: string
  node?: Element
  extraProps?: ExtraProps
}>()
const code = ref("")
const lang = ref("")
const vnode = shallowRef<VNode>()
const vCode = h(Code)
const vRawCode = h(RawCode)
watchEffect(() => {
  if (!props.node) return
  if (isUndefined(props.children)) return
  lang.value = getLang(props.node)
  code.value = props.children
  if (lang.value) {
    vnode.value = cloneVNode(vCode, {
      lang: lang.value,
      code: code.value,
      forcePlaintext: !!props.extraProps?.forcePlaintext,
    })
  } else {
    vnode.value = cloneVNode(vRawCode, {
      lang: lang.value,
      code: code.value,
    })
  }
})
</script>
<template>
  <component :is="vnode"></component>
</template>
