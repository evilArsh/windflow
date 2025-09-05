<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import useProviderStore from "@renderer/store/provider"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import useSettingsStore from "@renderer/store/settings"
import { storeToRefs } from "pinia"
import Config from "./components/config.vue"
import { SettingKeys } from "@renderer/types"
import { ElEmpty } from "element-plus"
import Handler from "./components/handler.vue"
const providerStore = useProviderStore()
const settingsStore = useSettingsStore()
const { t } = useI18n()
const { providerMetas, currentProvider } = storeToRefs(providerStore)
const useConfigComponent = () => {
  function getComponent(name?: string) {
    if (!name) return h(ElEmpty)
    if (!providerStore.providerManager.availableProviders().some(v => v.name() === name)) {
      return h(ElEmpty)
    }
    return h(Config)
  }
  return {
    getComponent,
  }
}
const providerMetasList = computed(() => Object.values(providerMetas.value))
const { getComponent } = useConfigComponent()
function onCardClick(name: string) {
  currentProvider.value = providerMetas.value[name] ?? undefined
}
settingsStore.api.dataWatcher<string | undefined>(
  SettingKeys.ProviderCurrentSettingActive,
  () => currentProvider.value?.name,
  ""
)
</script>
<template>
  <SubNavLayout :id="SettingKeys.ModelSubNav">
    <template #submenu>
      <el-scrollbar>
        <div class="flex flex-col p1rem">
          <div class="mb-1rem">
            <ContentBox normal>
              <el-text class="text-2.6rem! font-600">{{ t("model.title") }}</el-text>
              <template #footer>
                <el-text type="info">{{ t("model.subTitle") }}</el-text>
              </template>
            </ContentBox>
          </div>
          <div class="mb-1rem">
            <Handler></Handler>
          </div>
          <div class="flex flex-col gap-1rem">
            <ContentBox
              v-for="meta in providerMetasList"
              :key="meta.name"
              :default-lock="currentProvider?.name == meta.name"
              still-lock
              :background="false"
              @click="onCardClick(meta.name)">
              <template #icon><Svg :src="meta.logo" class="text-2rem"></Svg></template>
              <el-text line-clamp="2">{{ meta.alias ?? meta.name }}</el-text>
            </ContentBox>
          </div>
        </div>
      </el-scrollbar>
    </template>
    <template #content>
      <ContentLayout>
        <component
          :key="currentProvider?.name"
          :is="getComponent(currentProvider?.name)"
          :provider-name="currentProvider?.name" />
      </ContentLayout>
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.provider-tree {
  --el-tree-node-content-height: 4rem;
}
</style>
