<script lang="ts" setup>
import { ProviderMeta, ModelMeta, ModelActiveStatus } from "@renderer/types"
import useModelStore from "@renderer/store/model"
import useProviderStore from "@renderer/store/provider"
import { storeToRefs } from "pinia"
import { ElMessage } from "element-plus"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, errorToText, msg } from "@toolmain/shared"
import { CombineTableProps } from "@renderer/components/Table/types"
import { useDataFilter } from "./dataFilter"
const { t } = useI18n()
const props = defineProps<{
  providerName: string
}>()
const svgRef = useTemplateRef("svg")

const modelStore = useModelStore()
const providerStore = useProviderStore()
const { providerMetas } = storeToRefs(providerStore)

const provider = computed<ProviderMeta | undefined>(() => providerMetas.value[props.providerName])

const {
  keyword,
  loading,
  list,
  modelTypeKeys,
  subProviders,
  currentPage,
  pageSize,
  total,
  onQuery,
  onList,
  //
} = useDataFilter(provider)

const tableProps = shallowReactive<CombineTableProps>({
  stripe: true,
  border: true,
  highlightCurrentRow: true,
  context: undefined,
  height: "100%",
})

const onModelChange = async (row: ModelMeta) => {
  try {
    await modelStore.put(row)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
const onProviderChange = async (row: ProviderMeta) => {
  try {
    await providerStore.update(row)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
const useIcon = () => {
  const current = ref("")
  const iconRow = ref<ModelMeta | null>(null)
  function onIconClick(e: MouseEvent, newRow: ModelMeta) {
    iconRow.value = newRow
    svgRef.value?.open(e.clientX, e.clientY)
  }
  function onModelIconChange(iconStr: string) {
    current.value = iconStr
    if (iconRow.value) {
      iconRow.value.icon = iconStr
      onModelChange(iconRow.value)
    }
  }
  return { current, onIconClick, onModelIconChange }
}
const { current, onIconClick, onModelIconChange } = useIcon()

async function onRefreshModel(done?: CallBackFn) {
  try {
    if (provider.value) {
      const meta = providerStore.providerManager.getProvider(provider.value.name)
      if (meta) {
        const models = await meta.fetchModels(provider.value)
        if (models.length) {
          await modelStore.refresh(models)
          await modelStore.init()
        }
      }
    }
    done?.()
  } catch (e) {
    done?.()
    ElMessage.error(errorToText(e))
  }
}
onMounted(onQuery)
</script>
<template>
  <ContentLayout custom v-if="provider">
    <template #header>
      <el-space class="p1rem">
        <el-text type="primary" :id="provider.name">{{ provider.alias ?? provider.name }}</el-text>
        <Button size="small" type="primary" plain @click="onRefreshModel">
          <i-ep-refresh></i-ep-refresh>
        </Button>
      </el-space>
    </template>
    <SvgPicker invoke-mode ref="svg" :model-value="current" @update:model-value="onModelIconChange"></SvgPicker>
    <div class="model-setting">
      <DialogPanel class="w-full h-auto grow-0! shrink! basis-auto!">
        <el-form :model="provider" label-width="10rem" class="w-full">
          <el-form-item :show-message="false" :label="t('provider.apiUrl')">
            <el-input v-model="provider.api.url" @input="onProviderChange(provider)" />
          </el-form-item>
          <el-form-item :show-message="false" :label="t('provider.apiKey')">
            <el-input
              v-model="provider.api.key"
              show-password
              @input="onProviderChange(provider)"
              @change="_ => onRefreshModel()" />
          </el-form-item>
        </el-form>
      </DialogPanel>
      <Table
        v-loading="loading"
        :data="list"
        :total
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        @change="onList"
        :table-props="tableProps">
        <template #header>
          <el-form label-width="10rem">
            <el-form-item :label="t('provider.model.type')">
              <el-select v-model="provider.selectedTypes" multiple filterable>
                <el-option
                  v-for="key in modelTypeKeys"
                  :key="key"
                  :label="t(`modelType.${key}`)"
                  :value="key"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('provider.model.subProvider')">
              <el-select v-model="provider.selectedSubProviders" multiple filterable>
                <el-option v-for="item in subProviders" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('provider.model.activeStatus')">
              <el-radio-group v-model="provider.activeStatus">
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
            <el-form-item :label="t('provider.model.searchKeyword')">
              <el-input v-model="keyword"> </el-input>
            </el-form-item>
          </el-form>
        </template>
        <el-table-column width="80" :label="t('provider.model.icon')">
          <template #default="{ row }: { row: ModelMeta }">
            <el-button @click="onIconClick($event, row)">
              <Svg class="text-2.5rem" :src="row.icon"></Svg>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="t('provider.model.name')">
          <template #default="{ row }">
            <el-text line-clamp="1">{{ row.modelName }}</el-text>
          </template>
        </el-table-column>
        <el-table-column :label="t('provider.model.type')">
          <template #default="{ row }: { row: ModelMeta }">
            <div class="flex flex-wrap gap0.5rem">
              <el-tag v-for="type in row.type" :key="type" type="primary">{{ t(`modelType.${type}`) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column width="80" :label="t('provider.model.active')">
          <template #default="{ row }">
            <el-switch v-model="row.active" @change="onModelChange(row)" />
          </template>
        </el-table-column>
      </Table>
    </div>
  </ContentLayout>
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
  gap: var(--ai-gap-large);
}
</style>
