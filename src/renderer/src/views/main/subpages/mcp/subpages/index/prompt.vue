<script lang="ts" setup>
import { MCPPromptItem } from "@shared/types/mcp"

const props = defineProps<{ data: MCPPromptItem }>()
const { t } = useI18n()
const params = computed(() => {
  return props.data.arguments ?? []
})
</script>
<template>
  <el-card style="--el-card-padding: 1rem" shadow="never">
    <ContentBox class="select-unset!">
      <template #icon>
        <i-fluent-emoji-flat:left-speech-bubble></i-fluent-emoji-flat:left-speech-bubble>
      </template>
      <el-text type="primary">{{ data.name }}</el-text>
      <template #footer>
        <el-text type="info" size="small">{{ data.description }}</el-text>
      </template>
    </ContentBox>
    <el-card v-for="param in params" :key="param.name" class="my-1rem" style="--el-card-padding: 0.5rem" shadow="never">
      <ContentBox class="select-unset!">
        <el-text size="small">{{ t("mcp.schema.params") }}</el-text>
        <template #footer>
          <el-badge :is-dot="param.required">
            <el-button text bg type="primary" size="small">{{ param.name }}</el-button>
          </el-badge>
          <el-text class="ml-1rem!" type="info" size="small">{{ param.description }}</el-text>
        </template>
      </ContentBox>
    </el-card>
  </el-card>
</template>
<style lang="scss" scoped></style>
