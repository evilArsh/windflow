<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import useProviderStore from "@renderer/store/provider.store"
import { storeToRefs } from "pinia"
import { ProviderName } from "@renderer/types"
import CnfDeepseek from "./components/config.vue"
import { ElEmpty } from "element-plus"
const providerStore = useProviderStore()
const { providerMetas } = storeToRefs(providerStore)
const current = ref<ProviderName>()
const { t } = useI18n()
const useConfigComponent = () => {
  const componentsMap = shallowReactive({
    [ProviderName.DeepSeek]: CnfDeepseek,
    [ProviderName.SiliconFlow]: CnfDeepseek,
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
const { getComponent } = useConfigComponent()
function onCardClick(name: ProviderName) {
  current.value = name
}
async function init() {
  if (!current.value) {
    current.value = providerMetas.value.length > 0 ? providerMetas.value[0].name : undefined
  }
}
watch(providerMetas, init)
onMounted(init)
</script>
<template>
  <SubNavLayout>
    <template #submenu>
      <el-scrollbar>
        <div class="provider-container">
          <Hover
            background
            v-for="item in providerMetas"
            :key="item.name"
            still-lock
            :default-lock="current == item.name">
            <el-card class="card" shadow="never" @click="onCardClick(item.name)">
              <div class="card-body">
                <el-image class="icon" :src="item.logo" />
                <el-text class="name">{{ t(item.alias || "") }}</el-text>
              </div>
            </el-card>
          </Hover>
        </div>
      </el-scrollbar>
    </template>
    <template #content>
      <ContentLayout>
        <component :key="current" :is="getComponent(current)" :provider-name="current" />
      </ContentLayout>
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.provider-container {
  --provider-container-padding: 0.5rem;
  --provider-container-icon-size: 2.5rem;
  padding: var(--provider-container-padding);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  .card {
    --el-card-padding: 0.3rem;
    --el-border-color-light: transparent;
    display: flex;
    align-items: center;
    .card-body {
      display: flex;
      align-items: center;
      gap: 1rem;
      .icon {
        width: var(--provider-container-icon-size);
        height: var(--provider-container-icon-size);
      }
      .name {
        font-size: 1.2rem;
      }
    }
  }
}
</style>
