<script setup lang="ts">
import { errorToText } from "@shared/error"
import useCopy from "./useCopy"
import { useShiki } from "@renderer/usable/useShiki"

const props = defineProps<{
  code: string
  lang: string
}>()
const Mermaid = defineAsyncComponent(() => import("./mermaid.vue"))
const { copied, onCopy } = useCopy()
const { codeToHtml } = useShiki()
const Code = h("div")
const vnode = shallowRef<VNode>()

watchEffect(() => {
  if (props.lang === "mermaid") {
    vnode.value = h(Mermaid, {
      code: props.code,
      lang: props.lang,
    })
  } else {
    codeToHtml(props.code, props.lang)
      .then(res => (vnode.value = h(Code, { innerHTML: res })))
      .catch(err => (vnode.value = h(Code, { innerHTML: errorToText(err) })))
  }
})
</script>
<template>
  <div class="markdown-code-block">
    <el-card class="code-block" shadow="never">
      <template #header>
        <div class="code-block-header">
          <el-tag type="primary">{{ lang }}</el-tag>
          <el-button type="primary" @click="onCopy(code)" size="small" round plain circle>
            <i-ic:outline-check v-if="copied"></i-ic:outline-check>
            <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
          </el-button>
        </div>
      </template>
      <component :is="vnode"></component>
    </el-card>
  </div>
</template>
<style lang="scss">
html.dark {
  .markdown-code-block {
    --code-block-border-color: #141414;
  }
}
.markdown-code-block {
  --code-block-border-color: #dce0e5;
  margin: 5px 0;
  .code-block {
    --el-card-padding: 1rem;
    border: solid 1px var(--code-block-border-color);
    border-radius: 0.5rem;
  }
  .code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .code-block-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
