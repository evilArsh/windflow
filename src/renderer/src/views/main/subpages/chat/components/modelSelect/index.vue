<script setup lang="ts">
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import { ModelType, type ModelMeta } from "@renderer/types"
import type { ChatTopic } from "@renderer/types"
const props = defineProps<{
  modelValue: ChatTopic
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: ChatTopic): void
}>()
const data = computed<ChatTopic>({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
const { t } = useI18n()
const modelStore = useModelStore()
const { models } = storeToRefs(modelStore)

const pop = reactive({
  show: false,
  toggle: markRaw(() => {
    pop.show = !pop.show
  }),
})
const activeModels = ref<Record<string, ModelMeta[]>>({})
watchEffect(() => {
  activeModels.value = models.value
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
    <el-popover placement="top" :width="400" trigger="click" v-model:visible="pop.show">
      <template #reference>
        <el-badge :value="data.modelIds.length" type="primary">
          <el-button size="small">
            <template #icon>
              <i-mdi:gift-open v-if="pop.show"></i-mdi:gift-open>
              <i-mdi:gift v-else></i-mdi:gift>
            </template>
            <el-text>{{ t("provider.model.name") }}</el-text>
          </el-button>
        </el-badge>
      </template>
      <template #default>
        <el-scrollbar max-height="500px">
          <el-checkbox-group v-model="data.modelIds" class="line-height-unset! text-inherit">
            <div class="flex flex-col gap-0.5rem">
              <div v-for="(item, provider) in activeModels" :key="provider">
                <el-card shadow="never" style="--el-card-padding: 1rem">
                  <template #header>
                    <el-text>{{ t(`provider.name.${provider}`) }}</el-text>
                  </template>
                  <div class="flex flex-col gap5px">
                    <el-checkbox v-for="model in item" :key="model.id" :value="model.id" :label="model.modelName" />
                  </div>
                </el-card>
              </div>
            </div>
          </el-checkbox-group>
        </el-scrollbar>
      </template>
    </el-popover>
  </div>
</template>
<style lang="scss" scoped></style>
