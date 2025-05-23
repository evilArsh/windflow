<script setup lang="ts">
import { ModelMeta, ProviderName } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { errorToText } from "@shared/error"
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

const onModelChange = async (row: ModelMeta) => {
  try {
    await modelStore.api.update(row)
    chatStore.refreshChatTopicModelIds(currentTopic.value?.node)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
const onModelIconChange = (icon: string, row: ModelMeta) => {
  row.icon = icon
  onModelChange(row)
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
          <el-table-column prop="modelName" :label="t('provider.model.name')" />
          <el-table-column prop="icon" :label="t('provider.model.icon')">
            <template #default="{ row }: { row: ModelMeta }">
              <SvgPicker
                :model-value="row.icon ?? ''"
                @update:model-value="icon => onModelIconChange(icon, row)"></SvgPicker>
            </template>
          </el-table-column>
          <el-table-column prop="type" :label="t('provider.model.type')">
            <template #default="{ row }: { row: ModelMeta }">
              <div class="flex flex-wrap gap0.5rem">
                <el-tag v-for="type in row.type" :key="type" type="primary">{{ t(`modelType.${type}`) }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('provider.model.active')">
            <template #default="{ row }">
              <el-switch v-model="row.active" @change="onModelChange(row)" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-timeline-item>
  </el-timeline>
</template>
