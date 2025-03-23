<script lang="ts" setup>
import { ProviderMeta, ModelMeta, ProviderName, ModelType } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
import useProviderStore from "@renderer/store/provider.store"
import { storeToRefs } from "pinia"
const { t } = useI18n()
const props = defineProps<{
  providerName: ProviderName
}>()
const modelStore = useModelStore()
const providerStore = useProviderStore()
const { models } = storeToRefs(modelStore)

const data = ref<ProviderMeta>()
const filter = reactive({
  typeKeys: markRaw(Object.keys(ModelType)),
  selectType: Object.keys(ModelType),
})

const dsModels = computed<ModelMeta[]>(() => {
  return models.value.filter(v => v.providerName === data.value?.name && filter.selectType.includes(v.type))
})
async function onRefreshModel(done: CallBackFn) {
  if (data.value) {
    const provider = providerStore.providerManager.getLLMProvider(data.value.name)
    if (provider) {
      const models = await provider.fetchModels(data.value)
      modelStore.refresh(models)
    }
  }
  done()
}
watch(
  () => props.providerName,
  name => {
    data.value = providerStore.find(name)
  },
  { immediate: true }
)
</script>
<template>
  <MsgBubble v-if="data">
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
        <div class="model-setting">
          <el-scrollbar class="w-full">
            <el-form :model="data" label-width="10rem" class="w-full" label-position="top">
              <el-form-item :label="t('provider.apiUrl')" class="w-full">
                <el-input v-model="data.apiUrl" />
              </el-form-item>
              <el-form-item :label="t('provider.apiKey')" class="w-full">
                <el-input v-model="data.apiKey" show-password />
              </el-form-item>
              <el-form-item :label="t('provider.model.name')" class="w-full">
                <el-card shadow="never" class="w-full">
                  <ContentLayout>
                    <template #header>
                      <div class="flex flex-col gap1rem w-full">
                        <div class="w-full">
                          <el-form-item label="模型类型" label-width="5rem">
                            <el-select v-model="filter.selectType" multiple clearable>
                              <el-option v-for="item in filter.typeKeys" :key="item" :label="item" :value="item" />
                            </el-select>
                          </el-form-item>
                        </div>
                        <div>
                          <el-form-item>
                            <Button size="small" type="primary" plain @click="onRefreshModel">
                              <i-ep:refresh></i-ep:refresh>
                            </Button>
                          </el-form-item>
                        </div>
                      </div>
                    </template>
                    <template #content>
                      <el-table
                        :data="dsModels"
                        border
                        stripe
                        row-key="id"
                        default-expand-all
                        table-layout="auto"
                        max-height="50vh">
                        <el-table-column prop="modelName" width="400rem" :label="t('provider.model.name')" />
                        <el-table-column prop="type" width="200rem" :label="t('provider.model.type')" />
                        <el-table-column label="使用">
                          <template #default="{ row }">
                            <el-switch v-model="row.active" />
                          </template>
                        </el-table-column>
                      </el-table>
                    </template>
                  </ContentLayout>
                </el-card>
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </div>
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
