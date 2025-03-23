<script lang="ts" setup>
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import { ModelType, type ModelMeta } from "@renderer/types"
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void
}>()
const props = defineProps<{
  modelValue: string[]
}>()

const collapses = ref(["1"])

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

const activeModels = computed<ModelMeta[]>(() => {
  return models.value.filter(v => v.active && (v.type === ModelType.Chat || v.type === ModelType.ChatReasoner))
})
</script>
<template>
  <div class="flex-1">
    <el-card shadow="never" style="--el-card-padding: 1rem">
      <el-collapse v-model="collapses">
        <el-collapse-item title="模型" name="1">
          <div class="flex flex-col gap1rem">
            <el-checkbox-group v-model="data">
              <el-checkbox v-for="model in activeModels" :key="model.id" :value="model.id" :label="model.modelName" />
            </el-checkbox-group>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>
