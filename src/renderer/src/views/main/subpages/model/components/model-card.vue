<script setup lang="ts">
import { ModelMeta } from "@renderer/types"
import useModelStore from "@renderer/store/model"
import { errorToText } from "@shared/utils"
const props = defineProps<{
  providerName: string
  data: ModelMeta[]
}>()
const { t } = useI18n()
const modelStore = useModelStore()
const svgRef = useTemplateRef("svg")
const icon = reactive({
  current: "",
  row: null as ModelMeta | null,
  onClick: markRaw((e: MouseEvent, row: ModelMeta) => {
    icon.row = row
    svgRef.value?.open(e.clientX, e.clientY)
  }),
  onModelIconChange: markRaw((iconStr: string) => {
    icon.current = iconStr
    if (icon.row) {
      icon.row.icon = iconStr
      onModelChange(icon.row)
    }
  }),
})

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
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
</script>
<template>
  <SvgPicker invoke-mode ref="svg" :model-value="icon.current" @update:model-value="icon.onModelIconChange"></SvgPicker>
  <el-timeline>
    <el-timeline-item v-for="(item, key) in handledData" :key="key" hide-timestamp>
      <el-card style="--el-card-padding: 0.7rem" shadow="hover">
        <template #header>
          <el-text type="primary">{{ key }}</el-text>
        </template>
        <el-table :data="item" border stripe row-key="id" default-expand-all table-layout="auto">
          <el-table-column prop="icon" width="80" :label="t('provider.model.icon')">
            <template #default="{ row }: { row: ModelMeta }">
              <el-button @click="icon.onClick($event, row)">
                <Svg class="text-2.5rem" :src="row.icon"></Svg>
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="modelName" width="300" :label="t('provider.model.name')" />
          <el-table-column prop="type" width="200" :label="t('provider.model.type')">
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
