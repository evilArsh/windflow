<script setup lang="ts">
import type { Element } from "hast"
import { getLang } from "../../worker/utils"
import { isUndefined } from "@toolmain/shared"
const props = defineProps<{
  children?: string
  node?: Element
}>()
const Code = defineAsyncComponent(() => import("./code.vue"))
const RawCode = defineAsyncComponent(() => import("./rawCode.vue"))
const code = ref("")
const lang = ref("")
const vnode = shallowRef<VNode>()
watchEffect(() => {
  if (!props.node) return
  if (isUndefined(props.children)) return
  // console.log("[props]", props)
  lang.value = getLang(props.node)
  code.value = props.children

  if (lang.value) {
    vnode.value = h(Code, {
      lang: lang.value,
      code: code.value,
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
