<script lang="ts" setup>
import Affix from "@renderer/components/Affix/index.vue"
</script>
<template>
  <div class="border-solid border-1px border-#333 h100vh w-100vw overflow-auto flex flex-col">
    <div class="flex-shrink-0 h-1600px border-solid border-1px border-b-amber">top</div>
    <div class="flex-shrink-0 bg-#ccc h-300px p5rem" id="affix">
      <Affix target="#affix" :offset="10" position="bottom">
        <el-card shadow="never">
          <el-button>按钮</el-button>
        </el-card>
      </Affix>
    </div>
    <div class="flex-shrink-0 h-3000px bg-red p-2rem border-solid border-1px border-b-amber">bottom</div>
  </div>
</template>
<style lang="scss" scoped></style>
