<script lang="ts" setup>
import { ProviderConfig, ModelConfig, ProviderName } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
import useProviderStore from "@renderer/store/provider.store"
import { storeToRefs } from "pinia"
const { t } = useI18n()
const props = defineProps<{
  modelValue: ProviderConfig
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: ProviderConfig): void
}>()
const data = computed<ProviderConfig>({
  get() {
    return props.modelValue
  },
  set(value) {
    emit("update:modelValue", value)
  },
})
const modelStore = useModelStore()
const { models } = storeToRefs(modelStore)
const providerStore = useProviderStore()
const dsModels = computed<ModelConfig[]>(() => {
  return models.value.filter(v => v.providerName === ProviderName.DeepSeek)
})
function onRefreshModel() {
  const provider = providerStore.providerManager.getLLMProvider(ProviderName.DeepSeek)
  if (provider) {
    provider.getModels()
  }
}
</script>
<template>
  <MsgBubble>
    <template #head>
      <el-avatar :src="data.logo" size="default" />
    </template>
    <template #content>
      <ContentLayout>
        <template #header>
          <div class="flex items-center">
            <el-text type="primary" :id="data.name">{{ t(data.alias || "") }}</el-text>
          </div>
        </template>
        <template #content>
          <div class="model-setting">
            <el-scrollbar class="w-full">
              <el-form :model="data" label-width="10rem" class="w-full">
                <el-form-item :label="t('provider.apiUrl')" class="w-full">
                  <el-input v-model="data.apiUrl" />
                </el-form-item>
                <el-form-item :label="t('provider.apiKey')" class="w-full">
                  <el-input v-model="data.apiKey" show-password />
                </el-form-item>
                <el-form-item :label="t('provider.model.name')" class="w-full">
                  <ContentLayout>
                    <template #header>
                      <div class="flex items-center">
                        <el-button size="small" type="primary" circle plain>
                          <i-ep:refresh></i-ep:refresh>
                        </el-button>
                      </div>
                    </template>
                    <template #content>
                      <el-table :data="dsModels" border stripe row-key="type" default-expand-all>
                        <el-table-column prop="id" label="id" />
                        <el-table-column prop="name" :label="t('provider.model.name')" />
                        <el-table-column prop="type" :label="t('provider.model.type')" />
                        <el-table-column prop="providerName" :label="t('provider.providerName')">
                          <template #default="{ row }">
                            <el-text :id="row.providerName">{{ t(`provider.name.${row.providerName}`) }}</el-text>
                          </template>
                        </el-table-column>
                      </el-table>
                    </template>
                  </ContentLayout>
                </el-form-item>
              </el-form>
            </el-scrollbar>
          </div>
        </template>
      </ContentLayout>
    </template>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.model-setting {
  --model-setting-padding: 1rem;
  --model-setting-bg-color: rgb(235, 235, 235);

  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--model-setting-bg-color);
  padding: var(--model-setting-padding);
  border-radius: 1rem;
}
</style>
