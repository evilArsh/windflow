<script lang="ts" setup>
import { ProviderMeta, ModelMeta, ModelActiveStatus } from "@windflow/core/types"
import useModelStore from "@renderer/store/model"
import useProviderStore from "@renderer/store/provider"
import { storeToRefs } from "pinia"
import { ElMessage } from "element-plus"
import ApiConfig from "./apiConfig.vue"
import Detail from "./detail.vue"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, errorToText, msg, msgWarning, useDialog } from "@toolmain/shared"
import { CombineTableProps } from "@renderer/components/Table/types"
import { useDataFilter } from "./dataFilter"
const { t } = useI18n()
const props = defineProps<{
  providerName: string
}>()
const svgRef = useTemplateRef("svg")
const {
  props: dlgProps,
  event: dlgEvent,
  close: dlgClose,
  open: dlgOpen,
} = useDialog({
  width: "50vw",
  showClose: false,
  destroyOnClose: true,
})
const {
  props: dlgDetailProps,
  event: dlgDetailEvent,
  close: dlgDetailClose,
  open: dlgDetailOpen,
} = useDialog({
  width: "50vw",
  showClose: false,
  destroyOnClose: true,
})
const modelStore = useModelStore()
const providerStore = useProviderStore()
const { providerMetas } = storeToRefs(providerStore)
const provider = computed<ProviderMeta | undefined>(() => providerMetas.value[props.providerName])
const { keyword, loading, list, modelTypeKeys, subProviders, currentPage, pageSize, total, onQuery, onList } =
  useDataFilter(provider)
const tableProps = shallowReactive<CombineTableProps>({
  stripe: true,
  border: true,
  highlightCurrentRow: true,
  context: undefined,
  height: "100%",
})
const tempMeta = shallowRef<ModelMeta>()
const ev = {
  async onRefreshModel(done?: CallBackFn) {
    try {
      if (provider.value) {
        const meta = providerStore.providerManager.getProvider(provider.value.name)
        if (meta) {
          const models = await meta.fetchModels(provider.value)
          if (models.length) {
            await modelStore.refresh(models)
            await modelStore.init()
          }
        } else {
          msgWarning(t("provider.notFound", { name: provider.value.name }))
        }
      }
      done?.()
    } catch (e) {
      done?.()
      ElMessage.error(errorToText(e))
    }
  },
  async onModelChange(row?: ModelMeta, done?: CallBackFn): Promise<boolean> {
    try {
      if (!row) return false
      await modelStore.put(row)
      return true
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
      return false
    } finally {
      done?.()
    }
  },
  async onProviderChange(row?: ProviderMeta, done?: CallBackFn) {
    try {
      if (!row) return
      await providerStore.update(row)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      done?.()
    }
  },
  onOpenApiConfig() {
    dlgOpen()
  },
  onOpenModelConfig(row: ModelMeta) {
    tempMeta.value = row
    dlgDetailOpen()
  },
  onCloseModelConfig() {
    dlgDetailClose()
    tempMeta.value = undefined
  },
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
      ev.onModelChange(iconRow.value)
    }
  }
  return { current, onIconClick, onModelIconChange }
}
const { current, onIconClick, onModelIconChange } = useIcon()

onMounted(onQuery)
</script>
<template>
  <ContentLayout custom v-if="provider">
    <template #header>
      <el-space class="p1rem">
        <el-text type="primary" :id="provider.name">{{ provider.alias ?? provider.name }}</el-text>
        <Button size="small" round type="default" plain @click="ev.onRefreshModel">
          <i-ep-refresh></i-ep-refresh>
        </Button>
      </el-space>
    </template>
    <SvgPicker invoke-mode ref="svg" :model-value="current" @update:model-value="onModelIconChange"></SvgPicker>
    <el-dialog v-bind="dlgProps" v-on="dlgEvent" :title="t('provider.apiInfo')">
      <ApiConfig :provider @close="dlgClose" @confirm="ev.onProviderChange"></ApiConfig>
    </el-dialog>
    <el-dialog v-bind="dlgDetailProps" v-on="dlgDetailEvent" :title="t('provider.modelConfig')">
      <Detail :model="tempMeta" @close="ev.onCloseModelConfig" @confirm="ev.onModelChange"></Detail>
    </el-dialog>
    <div class="model-setting">
      <DialogPanel class="w-full h-auto grow-0! shrink! basis-auto!">
        <el-form :model="provider" label-width="10rem" class="w-full">
          <el-form-item :label="t('provider.apiUrl')">
            <el-input v-model="provider.api.url" @input="ev.onProviderChange(provider)" />
          </el-form-item>
          <el-form-item :label="t('provider.apiKey')">
            <el-input
              v-model="provider.api.key"
              show-password
              @input="ev.onProviderChange(provider)"
              @change="_ => ev.onRefreshModel()" />
          </el-form-item>
          <el-form-item label="">
            <el-button size="small" @click="ev.onOpenApiConfig">
              <i-ic-outline-settings class="text-1.4rem"></i-ic-outline-settings>
              <span>{{ t("provider.apiInfo") }}</span>
            </el-button>
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
        <el-table-column width="100" :label="t('provider.model.action')" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="ev.onOpenModelConfig(row)" link type="primary">
              <i-ep-edit></i-ep-edit>
              <span>{{ t("btn.edit") }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column width="80" :label="t('provider.model.active')" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.active" @change="ev.onModelChange(row)" />
          </template>
        </el-table-column>
        <el-table-column width="80" :label="t('provider.model.icon')" align="center">
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
