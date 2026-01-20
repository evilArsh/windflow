<script setup lang="ts">
import { Copy } from "@toolmain/components"
import { useDownload } from "@toolmain/shared"
import PureCode from "../PureCode/index.vue"
defineProps<{
  code: string
  lang: string
  forcePlaintext?: boolean
}>()
const { downloadCode } = useDownload()
const id = useId()
</script>
<template>
  <div class="markdown-code-block" :class="{ forcePlaintext }">
    <PureCode v-if="forcePlaintext" :code :lang :force-plaintext></PureCode>
    <el-card v-else class="code-block" shadow="never">
      <template #header>
        <div class="code-block-header">
          <el-tag type="primary">{{ lang }}</el-tag>
          <div class="flex items-center">
            <Copy :text="code"></Copy>
            <el-button type="primary" @click="downloadCode(code, lang, `index_${id}`)" size="small" round plain circle>
              <i-ic-baseline-download></i-ic-baseline-download>
            </el-button>
          </div>
        </div>
      </template>
      <PureCode :code :lang></PureCode>
    </el-card>
  </div>
</template>
<style lang="scss">
.markdown-code-block {
  margin: 5px 0;
  .code-block {
    --el-card-padding: 1rem;
    border: solid 1px var(--el-border-color-lighter);
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
  .shiki {
    code {
      span.line {
        white-space: pre-wrap;
        word-break: break-word;
      }
      span.line::before {
        counter-increment: line;
        content: counter(line);
        display: inline-block;
        width: 2em;
        margin-right: 1em;
        color: var(--el-text-color-regular);
        text-align: right;
        user-select: none;
      }
    }
  }
  &.forcePlaintext {
    .shiki {
      code {
        span.line::before {
          display: none;
        }
      }
    }
  }
}
</style>
