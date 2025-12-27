<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys, SettingsValue } from "@windflow/core/types"
import { CSSProperties } from "@toolmain/shared"
import { Resize } from "@toolmain/components"
const emit = defineEmits<{
  (e: "afterScale"): void
  (e: "scaling"): void
}>()
const props = defineProps<{
  id: SettingKeys
  hideSubmenu?: boolean
}>()
const settingsStore = useSettingsStore()

const hideSub = computed<CSSProperties>(() => (props.hideSubmenu ? { display: "none" } : {}))
const handlerStyle = ref<CSSProperties>({})
settingsStore.dataWatcher<Record<string, SettingsValue>>(props.id, handlerStyle, {
  width: "300px",
})
</script>
<template>
  <div class="subnav-container">
    <div class="subnav-provider" :style="[hideSub, handlerStyle]">
      <el-card class="subnav-card" body-class="flex flex-1 flex-col overflow-hidden" shadow="never">
        <slot name="submenu"></slot>
      </el-card>
      <Resize
        v-model="handlerStyle"
        size="8px"
        direction="right"
        @scaling="emit('scaling')"
        @after-scale="emit('afterScale')" />
    </div>
    <div class="subnav-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.subnav-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: var(--ai-gap-base);
  .subnav-provider {
    overflow: hidden;
    min-width: 0;
    background-color: var(--el-bg-color);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .subnav-card {
    --el-card-border-color: transparent;
    --el-card-padding: 0.25rem;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    overflow: hidden;
  }
  .subnav-content {
    overflow: hidden;
    display: flex;
    flex: 1;
  }
}
</style>
