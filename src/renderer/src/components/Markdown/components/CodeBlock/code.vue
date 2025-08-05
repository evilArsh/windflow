<script setup lang="ts">
import useCopy from "./usable/useCopy"
import useDownload from "./usable/useDownload"
import PureCode from "../PureCode/index.vue"
defineProps<{
  code: string
  lang: string
}>()
const { copied, onCopy } = useCopy()
const { download } = useDownload()
const id = useId()
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
}
</style>
