<script lang="ts" setup>
import { ProviderMeta, ModelMeta, ProviderName, ModelType, ModelActiveStatus } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
import useProviderStore from "@renderer/store/provider.store"
import { storeToRefs } from "pinia"
import { ElMessage } from "element-plus"
import ModelCard from "./model-card.vue"
import type { CheckboxValueType } from "element-plus"
import { errorToText } from "@shared/error"
const { t } = useI18n()
const props = defineProps<{
  providerName: ProviderName
}>()
const modelStore = useModelStore()
const providerStore = useProviderStore()
const { models } = storeToRefs(modelStore)
const { providerMetas } = storeToRefs(providerStore)

const scopeModels = computed<ModelMeta[]>(() =>
  models.value.filter(v => data.value && v.providerName === data.value.name)
)

const filteredModels = computed<ModelMeta[]>(() => {
  return scopeModels.value.filter(
    meta =>
      data.value &&
      data.value.selectedTypes.includes(meta.type) &&
      data.value.selectedSubProviders.includes(meta.subProviderName) &&
      (data.value.activeStatus === ModelActiveStatus.All ||
        (data.value.activeStatus === ModelActiveStatus.Active && meta.active) ||
        (data.value.activeStatus === ModelActiveStatus.Inactive && !meta.active))
  )
})

const data = ref<ProviderMeta>()
const filter = reactive({
  typeKeys: markRaw(Object.keys(ModelType)),
  subProviders: computed(() => {
    return scopeModels.value.reduce<string[]>((acc, cur) => {
      if (!acc.includes(cur.subProviderName)) {
        acc.push(cur.subProviderName)
      }
      return acc
    }, [])
  }),
})

const check = reactive({
  allModelTypes: false,
  isIndeterminateModelTypes: true,
  onAllModelTypesChange: markRaw((val: CheckboxValueType) => {
    check.isIndeterminateModelTypes = false
    if (data.value) {
      data.value.selectedTypes = val ? filter.typeKeys : []
    }
  }),
  onModelTypesChange: markRaw((val: CheckboxValueType[]) => {
    check.allModelTypes = val.length === filter.typeKeys.length
    check.isIndeterminateModelTypes = val.length > 0 && val.length < filter.typeKeys.length
  }),

  allSubProviders: false,
  isIndeterminateSubProviders: true,
  onAllSubProvidersChange: markRaw((val: CheckboxValueType) => {
    check.isIndeterminateSubProviders = false
    if (data.value) {
      data.value.selectedSubProviders = val ? filter.subProviders : []
    }
  }),
  onSubProvidersChange: markRaw((val: CheckboxValueType[]) => {
    check.allSubProviders = val.length === filter.subProviders.length
    check.isIndeterminateSubProviders = val.length > 0 && val.length < filter.subProviders.length
  }),
})
async function onRefreshModel(done: CallBackFn) {
  try {
    if (data.value) {
      const provider = providerStore.providerManager.getLLMProvider(data.value.name)
      if (provider) {
        const models = await provider.fetchModels(data.value)
        await modelStore.api.refresh(models)
      }
    }
    done()
  } catch (e) {
    done()
    ElMessage.error(errorToText(e))
  }
}

watch(
  () => props.providerName,
  name => {
    data.value = providerMetas.value[name]
  },
  { immediate: true }
)

watch(
  () => data.value,
  (val, old) => {
    if (val && val === old) {
      providerStore.api.update(val)
    }
  },
  { deep: true }
)
</script>
<template>
  <MsgBubble v-if="data">
    <ContentLayout>
      <template #header>
        <div class="flex items-center p1rem">
          <el-text type="primary" :id="data.name">{{ t(data.alias || "") }}</el-text>
        </div>
      </template>
      <div class="model-setting">
        <el-form :model="data" label-width="10rem" class="w-full" label-position="top">
          <el-form-item :label="t('provider.apiUrl')" class="w-full">
            <el-input v-model="data.apiUrl" />
          </el-form-item>
          <el-form-item :label="t('provider.apiKey')" class="w-full">
            <el-input v-model="data.apiKey" show-password />
          </el-form-item>
          <el-form-item :label="t('provider.model.name')" class="w-full">
            <el-card shadow="never" class="w-full">
              <div class="flex flex-col gap-2rem w-full">
                <el-form-item :label="t('provider.model.type')" label-width="5rem">
                  <el-checkbox
                    style="margin-right: 2rem"
                    size="small"
                    v-model="check.allModelTypes"
                    :indeterminate="check.isIndeterminateModelTypes"
                    @change="check.onAllModelTypesChange">
                    {{ t("tip.selectAll") }}
                  </el-checkbox>
                  <el-checkbox-group
                    class="flex flex-wrap gap-1rem"
                    v-model="data.selectedTypes"
                    @change="check.onModelTypesChange"
                    size="small">
                    <el-checkbox
                      border
                      style="margin-right: 0"
                      v-for="item in filter.typeKeys"
                      :key="item"
                      :label="t(`modelType.${item}`)"
                      :value="item" />
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item :label="t('provider.model.subProvider')" label-width="5rem">
                  <el-checkbox
                    style="margin-right: 2rem"
                    size="small"
                    v-model="check.allSubProviders"
                    :indeterminate="check.isIndeterminateSubProviders"
                    @change="check.onAllSubProvidersChange">
                    {{ t("tip.selectAll") }}
                  </el-checkbox>
                  <el-checkbox-group
                    class="flex flex-wrap gap-1rem"
                    v-model="data.selectedSubProviders"
                    @change="check.onSubProvidersChange"
                    size="small">
                    <el-checkbox
                      style="margin-right: 0"
                      border
                      v-for="item in filter.subProviders"
                      :key="item"
                      :label="item"
                      :value="item" />
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item :label="t('provider.model.activeStatus')" label-width="5rem">
                  <el-radio-group v-model="data.activeStatus" size="small">
                    <el-radio-button :value="ModelActiveStatus.All">
                      {{ t("provider.model.activeStatusAll") }}
                    </el-radio-button>
                    <el-radio-button :value="ModelActiveStatus.Active">
                      {{ t("provider.model.activeStatusActive") }}
                    </el-radio-button>
                    <el-radio-button :value="ModelActiveStatus.Inactive">
                      {{ t("provider.model.activeStatusInactive") }}
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item>
                  <Button size="small" type="primary" plain @click="onRefreshModel">
                    <i-ep:refresh></i-ep:refresh>
                  </Button>
                </el-form-item>
                <ModelCard :data="filteredModels" :provider-name="data.name" />
              </div>
            </el-card>
          </el-form-item>
        </el-form>
      </div>
    </ContentLayout>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.model-setting {
  --model-setting-padding: 1rem;

  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--model-setting-padding);
  border-radius: 1rem;
}
</style>
