<script lang="ts" setup>
import { MCPResourceTemplatesItem } from "@shared/types/mcp"

defineProps<{ data: MCPResourceTemplatesItem }>()
</script>
<template>
  <el-card style="--el-card-padding: 1rem" shadow="never">
    <ContentBox class="select-unset!">
      <template #icon>
        <i-fluent-emoji-flat-open-file-folder></i-fluent-emoji-flat-open-file-folder>
      </template>
      <el-text type="primary">{{ data.name }}</el-text>
    </ContentBox>
    <el-card v-for="(value, key) in data" :key="key" class="my-1rem" style="--el-card-padding: 0.5rem" shadow="never">
      <ContentBox class="select-unset!">
        <el-button text bg type="primary" size="small">{{ key }}</el-button>
        <el-text class="ml-1rem!" type="info" size="small">{{ value }}</el-text>
      </ContentBox>
    </el-card>
  </el-card>
</template>
<style lang="scss" scoped></style>
