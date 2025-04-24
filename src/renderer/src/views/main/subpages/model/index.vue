<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import useProviderStore from "@renderer/store/provider.store"
import useSettingsStore from "@renderer/store/settings.store"
import { storeToRefs } from "pinia"
import { ProviderName, ProviderMeta } from "@renderer/types"
import CnfDeepseek from "./components/config.vue"
import { ElEmpty } from "element-plus"
import Handler from "./components/handler.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
const providerStore = useProviderStore()
const settingsStore = useSettingsStore()
const { providerMetas, currentProvider } = storeToRefs(providerStore)
const { t } = useI18n()
const useConfigComponent = () => {
  const componentsMap = shallowReactive({
    [ProviderName.DeepSeek]: CnfDeepseek,
    [ProviderName.SiliconFlow]: CnfDeepseek,
    [ProviderName.Volcengine]: CnfDeepseek,
    [ProviderName.OpenAI]: CnfDeepseek,
    [ProviderName.System]: h(ElEmpty),
  })
  function getComponent(name?: ProviderName) {
    if (!name) return h(ElEmpty)
    const component = componentsMap[name]
    if (!component) return h(ElEmpty)
    return h(component)
  }
  return {
    componentsMap,
    getComponent,
  }
}
const providerMetasList = computed(() => Object.values(providerMetas.value))
const { getComponent } = useConfigComponent()
function onCardClick(name: ProviderName) {
  currentProvider.value = providerMetas.value[name] ?? undefined
}
settingsStore.api.dataWatcher<string | undefined>(
  "provider.currentSettingActive",
  () => currentProvider.value?.name,
  ""
)
</script>
<template>
  <SubNavLayout id="model.subNav">
    <template #submenu>
      <Handler></Handler>
      <el-scrollbar>
        <el-tree
          class="provider-tree"
          :current-node-key="currentProvider?.name"
          highlight-current
          node-key="name"
          :data="providerMetasList">
          <template #default="{ data }: { data: ProviderMeta }">
            <ContentBox normal @click.stop="onCardClick(data.name)">
              <template #icon>
                <Svg :src="data.logo" class="text-2rem"></Svg>
              </template>
              <el-text line-clamp="2">{{ t(data.alias || "") }}</el-text>
            </ContentBox>
          </template>
        </el-tree>
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
