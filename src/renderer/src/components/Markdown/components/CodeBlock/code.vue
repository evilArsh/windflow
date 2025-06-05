<script setup lang="ts">
import { errorToText } from "@shared/error"
import useCopy from "./usable/useCopy"
import useDownload from "./usable/useDownload"
import { useShiki } from "@renderer/usable/useShiki"
import { toVueRuntime } from "../../worker/toVueRuntime"
const props = defineProps<{
  code: string
  lang: string
}>()
const Mermaid = defineAsyncComponent(() => import("./mermaid.vue"))
const { copied, onCopy } = useCopy()
const { download } = useDownload()
const { codeToAst } = useShiki()
const vnode = shallowRef<VNode>()
const id = useId()
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
      .catch(err => (vnode.value = h("div", { innerHTML: errorToText(err) })))
  }
})
</script>
<template>
  <div class="markdown-code-block">
    <el-card class="code-block" shadow="never">
      <template #header>
        <div class="code-block-header">
          <el-tag type="primary">{{ lang }}</el-tag>
          <div class="flex items-center">
            <el-button type="primary" @click="onCopy(code)" size="small" round plain circle>
              <i-ic:outline-check v-if="copied"></i-ic:outline-check>
              <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
            </el-button>
            <el-button type="primary" @click="download(code, lang, id)" size="small" round plain circle>
              <i-ic:baseline-download></i-ic:baseline-download>
            </el-button>
          </div>
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
