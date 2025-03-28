<script lang="ts" setup>
import { ref, computed } from "vue"
import ScalePanel from "@renderer/components/ScalePanel/index.vue"
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import { ModelType, type ModelMeta } from "@renderer/types"
import { type ScaleConfig } from "@renderer/components/ScalePanel/types"
import { defaultProps } from "@renderer/components/ScalePanel/helper"

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
const scaleConfig = ref<ScaleConfig>(
  defaultProps({
    movable: true,
    scalable: true,
    name: "配置",
    autoStick: false,
    closable: false,
    minimized: false,
    hideFirst: true,
    defaultHeader: true,
    defaultToolbar: false,
    moveConfig: {
      direction: "any",
    },
    containerStyle: {
      backgroundColor: "#f7f7f7",
      position: "fixed",
      zIndex: z.FIXED_CONFIG,
      boxSizing: "content-box",
      width: 800,
      height: 720,
      userSelect: "none",
      overflow: "hidden",
    },
    contentStyle: {
      position: "relative",
    },
  })
)
</script>
<template>
  <ScalePanel :model-value="scaleConfig">
    <el-card class="flex-shrink-0 w-35rem" shadow="never" style="--el-card-padding: 1rem">
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
  </ScalePanel>
</template>
