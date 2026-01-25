<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import useProviderStore from "@renderer/store/provider"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import useSettingsStore from "@renderer/store/settings"
import { storeToRefs } from "pinia"
import ModelList from "./components/modelList/index.vue"
import { ProviderMeta, SettingKeys } from "@windflow/core/types"
import { ElEmpty } from "element-plus"
import Handler from "./components/handler.vue"
import { useShortcut } from "@toolmain/shared"
const shortcut = useShortcut()
const providerStore = useProviderStore()
const settingsStore = useSettingsStore()
const { t } = useI18n()
const { providerMetas } = storeToRefs(providerStore)
const useConfigComponent = () => {
  function getComponent(name?: string) {
    if (!name) return h(ElEmpty)
    if (!providerStore.providerManager.getAvailable().some(v => v.name() === name)) {
      return h(ElEmpty)
    }
    return h(ModelList)
  }
  return {
    getComponent,
  }
}
const { getComponent } = useConfigComponent()

const currentProvider = ref<ProviderMeta>()
const { data: currentProviderName } = settingsStore.dataWatcher<string>(
  SettingKeys.ProviderCurrentSettingActive,
  null,
  "",
  name => {
    if (!name) {
      currentProvider.value = undefined
    } else {
      currentProvider.value = providerStore.findProviderMeta(name)
    }
  }
)
const { data: showSubNav } = settingsStore.dataWatcher<boolean>(SettingKeys.ModelToggleSubNav, null, true)
const ev = {
  onCardClick(name: string) {
    currentProviderName.value = name
  },
  toggleNav(_?: MouseEvent) {
    showSubNav.value = !showSubNav.value
  },
}

shortcut.listen("ctrl+b", res => {
  res && ev.toggleNav()
})
</script>
<template>
  <SubNavLayout :id="SettingKeys.ModelSubNav" :hide-submenu="!showSubNav">
    <template #submenu>
      <el-scrollbar>
        <div class="flex flex-col p1rem">
          <div class="mb-1rem">
            <ContentBox normal>
              <el-text class="text-2.6rem! font-600">{{ t("model.title") }}</el-text>
              <template #end>
                <teleport to="#mainContentHeaderSlot" defer :disabled="showSubNav">
                  <ContentBox @click="ev.toggleNav" background>
                    <i-material-symbols-right-panel-close-outline
                      class="text-1.6rem"
                      v-if="!showSubNav"></i-material-symbols-right-panel-close-outline>
                    <i-material-symbols-left-panel-close-outline
                      class="text-1.6rem"
                      v-else></i-material-symbols-left-panel-close-outline>
                  </ContentBox>
                </teleport>
              </template>
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
              v-for="meta in providerMetas"
              :key="meta.name"
              :default-lock="currentProvider?.name == meta.name"
              still-lock
              :background="false"
              @click="ev.onCardClick(meta.name)">
              <template #icon><Svg :src="meta.logo" class="text-2rem"></Svg></template>
              <el-text line-clamp="2">{{ meta.alias ?? meta.name }}</el-text>
            </ContentBox>
          </div>
        </div>
      </el-scrollbar>
    </template>
    <template #content>
      <component
        :key="currentProvider?.name"
        :is="getComponent(currentProvider?.name)"
        :provider-name="currentProvider?.name" />
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.provider-tree {
  --el-tree-node-content-height: 4rem;
}
</style>
