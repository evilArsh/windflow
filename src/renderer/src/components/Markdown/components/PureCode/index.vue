<script lang="ts" setup>
import { errorToText, useShiki } from "@toolmain/shared"
import { toVueRuntime } from "../../worker/toVueRuntime"
import { ElText } from "element-plus"
const { codeToAst } = useShiki()

const props = defineProps<{
  code: string
  lang: string
}>()

const Mermaid = defineAsyncComponent(() => import("../Mermaid/index.vue"))
const vnode = shallowRef<VNode>()
watchEffect(() => {
  if (props.lang === "mermaid") {
    vnode.value = h(Mermaid, {
      code: props.code,
      lang: props.lang,
    })
  } else {
    codeToAst(props.code, props.lang)
      .then(res => {
        vnode.value = toVueRuntime(res, {
          ignoreInvalidStyle: true,
          stylePropertyNameCase: "css",
          passKeys: true,
          passNode: true,
        })
      })
      .catch(err => (vnode.value = h(ElText, { type: "danger" }, { default: () => errorToText(err) })))
  }
})
</script>
<template>
  <component :is="vnode"></component>
</template>
<style lang="scss" scoped></style>
