<script setup lang="ts">
import { ModelMeta } from "@renderer/types"
import { useI18n } from "vue-i18n"
defineProps<{
  data: ModelMeta[]
}>()
const { t } = useI18n()
</script>
<template>
  <el-table :data border stripe row-key="id" default-expand-all table-layout="auto">
    <el-table-column prop="modelName" width="400" :label="t('provider.model.name')" />
    <el-table-column prop="type" width="200" :label="t('provider.model.type')">
      <template #default="{ row }">
        <el-text type="primary">{{ t(`modelType.${row.type}`) }}</el-text>
      </template>
    </el-table-column>
    <el-table-column label="使用">
      <template #default="{ row }">
        <el-switch v-model="row.active" />
      </template>
    </el-table-column>
  </el-table>
</template>
