<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import useProviderStore from "@renderer/pinia/provider.store"
import { storeToRefs } from "pinia"
import { ProviderName } from "@renderer/types"
import CnfDeepseek from "./components/cnf-deepseek.vue"
import CnfSilicon from "./components/cnf-silicon.vue"
import { ElEmpty } from "element-plus"
const providerStore = useProviderStore()
const { providers } = storeToRefs(providerStore)
const currentProviderId = ref("")
const useConfigComponent = () => {
  const componentsMap = shallowReactive({
    [ProviderName.DeepSeek]: CnfDeepseek,
    [ProviderName.SiliconFlow]: CnfSilicon,
    [ProviderName.System]: h("div", "系统"),
  })
  function getComponent(name: ProviderName) {
    const component = componentsMap[name]
    if (!component) {
      return h(ElEmpty)
    }
    return h(component)
  }
  return {
    componentsMap: toRef(componentsMap),
    getComponent,
  }
}
const { getComponent } = useConfigComponent()
</script>
<template>
  <SubNavLayout>
    <template #submenu>
      <el-scrollbar>
        <div class="provider-container">
          <Hover
            background
            v-for="item in providers"
            :key="item.name"
            still-lock
            :default-lock="currentProviderId == item.id">
            <el-card class="card" shadow="never" @click="currentProviderId = item.id">
              <div class="card-body">
                <el-image class="icon" :src="item.logo" />
                <el-text class="name">{{ item.name }}</el-text>
              </div>
            </el-card>
          </Hover>
        </div>
      </el-scrollbar>
    </template>
    <template #content>
      <ContentLayout>
        <template #content>
          <component v-for="item in providers" :key="item.name" :is="getComponent(item.name)" :model-value="item" />
        </template>
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
