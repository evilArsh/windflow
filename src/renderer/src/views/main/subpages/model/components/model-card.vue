<script setup lang="ts">
import { ModelMeta, ProviderName } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
const props = defineProps<{
  providerName: ProviderName
  data: ModelMeta[]
}>()
const { t } = useI18n()
const modelStore = useModelStore()
const chatStore = useChatStore()
const { currentTopic } = storeToRefs(chatStore)

const handledData = computed<Record<string, ModelMeta[]>>(() => {
  return props.data.reduce((acc, cur) => {
    if (acc[cur.subProviderName]) {
      acc[cur.subProviderName].push(cur)
    } else {
      acc[cur.subProviderName] = [cur]
    }
    return acc
  }, {})
})

const onModelChange = (row: ModelMeta) => {
  modelStore.dbUpdate(row)
  chatStore.refreshChatTopicModelIds(currentTopic.value?.node)
}
</script>
<template>
  <el-timeline>
    <el-timeline-item v-for="(item, key) in handledData" :key="key" hide-timestamp>
      <el-card style="--el-card-padding: 0.7rem" shadow="hover">
        <template #header>
          <el-text type="primary">{{ key }}</el-text>
        </template>
        <el-table :data="item" border stripe row-key="id" default-expand-all table-layout="auto">
          <el-table-column prop="modelName" width="400" :label="t('provider.model.name')" />
          <el-table-column prop="type" width="200" :label="t('provider.model.type')">
            <template #default="{ row }">
              <el-text type="primary">{{ t(`modelType.${row.type}`) }}</el-text>
            </template>
          </el-table-column>
          <el-table-column label="使用">
            <template #default="{ row }">
              <el-switch v-model="row.active" @change="onModelChange(row)" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-timeline-item>
  </el-timeline>
</template>
