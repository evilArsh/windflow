<script setup lang="ts">
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import { ModelType, type ModelMeta } from "@renderer/types"
const props = defineProps<{
  modelValue: string[]
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void
}>()
const { t } = useI18n()
const modelStore = useModelStore()
const { models } = storeToRefs(modelStore)
const data = computed({
  get() {
    return props.modelValue
  },
  set(val: string[]) {
    emit("update:modelValue", val)
  },
})
const activeModels = computed<Record<string, ModelMeta[]>>(() => {
  return models.value
    .filter(v => v.active && (v.type === ModelType.Chat || v.type === ModelType.ChatReasoner))
    .reduce((acc, cur) => {
      if (acc[cur.providerName]) {
        acc[cur.providerName].push(cur)
      } else {
        acc[cur.providerName] = [cur]
      }
      return acc
    }, {})
})
</script>
<template>
  <div>
    <el-card shadow="never" style="--el-card-padding: 1rem">
      <el-scrollbar max-height="500px">
        <div class="flex flex-col gap1rem">
          <div div v-for="provider in Object.keys(activeModels)" :key="provider">
            <el-text>{{ t(`provider.name.${provider}`) }}</el-text>
            <el-checkbox-group v-model="data">
              <div class="flex flex-col gap5px">
                <el-checkbox
                  v-for="model in activeModels[provider]"
                  :key="model.id"
                  :value="model.id"
                  :label="model.modelName" />
              </div>
            </el-checkbox-group>
          </div>
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>
<style lang="scss" scoped></style>
