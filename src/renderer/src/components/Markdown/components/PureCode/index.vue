<script lang="ts" setup>
import { errorToText, useShiki } from "@toolmain/shared"
import { useVueRuntime } from "@windflow/markdown"
import { ElText } from "element-plus"
const { codeToAst } = useShiki()

const props = defineProps<{
  code: string
  lang: string
  forcePlaintext?: boolean
}>()
const rt = useVueRuntime()
const Mermaid = defineAsyncComponent(() => import("../Mermaid/index.vue"))
const vnode = shallowRef<VNode>()
watchEffect(() => {
  if (props.lang === "mermaid") {
    vnode.value = h(Mermaid, {
      code: props.code,
      lang: props.lang,
    })
  } else {
    codeToAst(props.code, props.lang, props.forcePlaintext ? "none" : undefined)
      .then(res => {
        vnode.value = rt.toVnode(res)
      })
      .catch(
        err =>
          (vnode.value = h(
            ElText,
            {
              type: "danger",
            },
            { default: () => errorToText(err) }
          ))
      )
  }
})
</script>
<template>
  <component :is="vnode"></component>
</template>
<style lang="scss" scoped></style>
