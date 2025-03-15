<template>
  <div class="flex gap20px flex-col">
    <Hover>
      <el-input-number></el-input-number>
    </Hover>
    <Hover>
      <el-button circle round>按钮</el-button>
    </Hover>
    <Hover need-lock>
      <el-button>hello world</el-button>
    </Hover>

    <Hover default-lock>
      <el-button>hello world</el-button>
    </Hover>

    <el-text type="primary" style="--el-text-font-size: 1.4rem" class="text-1.4rem">文字测试</el-text>
    <el-text type="primary" style="--el-text-font-size: 14px" class="text-1.4rem">文字测试</el-text>
    <el-text type="danger" style="--el-text-font-size: 1.6rem" class="text-1.6rem">文字测试</el-text>
    <el-text type="danger" style="--el-text-font-size: 16px" class="text-1.6rem">文字测试</el-text>
    <el-text type="success" style="--el-text-font-size: 1.8rem" class="text-1.8rem">文字测试</el-text>
    <el-text type="success" style="--el-text-font-size: 18px" class="text-1.8rem">文字测试</el-text>
  </div>
</template>
<script lang="ts" setup>
onMounted(() => {})
</script>

<style lang="scss" scoped>
.hover-wrap {
  display: contents;
}
</style>
