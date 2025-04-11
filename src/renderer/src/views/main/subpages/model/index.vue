<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import useProviderStore from "@renderer/store/provider.store"
import useSettingsStore from "@renderer/store/settings.store"
import { storeToRefs } from "pinia"
import { ProviderName, ProviderMeta } from "@renderer/types"
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
      <Handler></Handler>
      <el-scrollbar>
        <el-tree
          class="provider-tree"
          :current-node-key="currentProvider?.name"
          highlight-current
          node-key="name"
          :data="providerMetasList">
          <template #default="{ data }: { data: ProviderMeta }">
            <div class="provider-tree-node" @click.stop="onCardClick(data.name)">
              <el-button text size="small" circle>
                <div class="provider-tree-icon">
                  <Svg :src="data.logo" class="text-2rem"></Svg>
                </div>
              </el-button>
              <el-text class="provider-tree-label" line-clamp="2">{{ t(data.alias || "") }}</el-text>
            </div>
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
.provider-tree-node {
  --chat-tree-icon-size: 3rem;
  display: flex;
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
  padding: 0.5rem;
  .provider-tree-icon {
    transition: all 0.3s ease-in-out;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--chat-tree-icon-size);
    height: var(--chat-tree-icon-size);
    border-radius: 0.5rem;
    &:hover {
      background-color: rgba(10, 205, 231, 0.2);
    }
  }
  .provider-tree-label {
    font-size: 14px;
    flex: 1;
    overflow: hidden;
  }
}
</style>
