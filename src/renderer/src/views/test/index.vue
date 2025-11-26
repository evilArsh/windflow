<template>
  <div class="flex gap20px flex-col">
    <ContentBox>
      <el-input-number></el-input-number>
    </ContentBox>
    <ContentBox>
      <el-button circle round>按钮</el-button>
    </ContentBox>
    <ContentBox need-lock>
      <el-button>hello world</el-button>
    </ContentBox>

    <ContentBox default-lock>
      <el-button>hello world</el-button>
    </ContentBox>

    <el-text type="primary" style="--el-text-font-size: 1rem">文字测试</el-text>
    <el-text type="primary" style="--el-text-font-size: 10px">文字测试</el-text>

    <el-text type="primary" style="--el-text-font-size: 1.2rem">文字测试</el-text>
    <el-text type="primary" style="--el-text-font-size: 12px">文字测试</el-text>

    <el-text type="primary" style="--el-text-font-size: 1.4rem">文字测试</el-text>
    <el-text type="primary" style="--el-text-font-size: 14px">文字测试</el-text>

    <el-text type="danger" style="--el-text-font-size: 1.6rem">文字测试</el-text>
    <el-text type="danger" style="--el-text-font-size: 16px">文字测试</el-text>

    <el-text type="success" style="--el-text-font-size: 1.8rem">文字测试</el-text>
    <el-text type="success" style="--el-text-font-size: 18px">文字测试</el-text>
    <el-divider></el-divider>
    <router-view></router-view>
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
