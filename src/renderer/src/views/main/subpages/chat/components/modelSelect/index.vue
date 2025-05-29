<script setup lang="ts">
import useModelStore from "@renderer/store/model"
import { storeToRefs } from "pinia"
import type { ModelMeta, ChatTopic } from "@renderer/types"
import useProviderStore from "@renderer/store/provider"
const emit = defineEmits<{
  (e: "change", topic: ChatTopic): void
}>()
const props = defineProps<{
  topic: ChatTopic
}>()
const data = computed(() => props.topic)
const { t } = useI18n()
const providerStore = useProviderStore()
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
    .filter(v => v.active)
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
    <el-popover placement="top" :width="450" trigger="click" v-model:visible="pop.show">
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
          <el-checkbox-group
            v-model="data.modelIds"
            @change="emit('change', data)"
            class="line-height-unset! text-inherit">
            <div class="select-wrap">
              <div v-for="(item, provider) in activeModels" :key="provider">
                <el-card shadow="never" style="--el-card-padding: 1rem">
                  <template #header>
                    <ContentBox>
                      <template #icon>
                        <Svg :src="providerStore.getProviderLogo(provider)"></Svg>
                      </template>
                      <el-text>{{ provider }}</el-text>
                    </ContentBox>
                  </template>
                  <div class="flex flex-col gap5px">
                    <el-checkbox v-for="model in item" :key="model.id" :value="model.id" :label="model.modelName">
                      <ModelName :data="model"></ModelName>
                    </el-checkbox>
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
<style lang="scss" scoped>
.select-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  :deep(.el-checkbox) {
    margin-right: 0;
  }
  :deep(.el-checkbox__label) {
    overflow: hidden;
  }
}
</style>
