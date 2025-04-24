<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import useProviderStore from "@renderer/store/provider.store"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import useSettingsStore from "@renderer/store/settings.store"
import { storeToRefs } from "pinia"
import { ProviderName } from "@renderer/types"
import CnfDeepseek from "./components/config.vue"
import { ElEmpty } from "element-plus"
import Handler from "./components/handler.vue"
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
      <el-scrollbar>
        <el-card style="--el-card-padding: 1rem" shadow="never">
          <div class="flex flex-col">
            <div class="my-1.2rem mb-2.4rem">
              <ContentBox normal background>
                <el-text class="text-2.6rem! font-600">模型</el-text>
                <template #footer>
                  <el-text type="info">模型和提供商设置</el-text>
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
                @click.stop="onCardClick(meta.name)">
                <template #icon><Svg :src="meta.logo" class="text-2rem"></Svg></template>
                <el-text line-clamp="2">{{ t(meta.alias || "") }}</el-text>
              </ContentBox>
            </div>
          </div>
        </el-card>
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
