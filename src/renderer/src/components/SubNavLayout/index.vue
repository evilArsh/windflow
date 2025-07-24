<script lang="ts" setup>
import { CSSProperties } from "@renderer/lib/shared/types"
import useSettingsStore from "@renderer/store/settings"
import { SettingsValue } from "@renderer/types"
const emit = defineEmits<{
  (e: "afterScale"): void
  (e: "scaling"): void
}>()
const props = defineProps<{
  id: string
  hideSubmenu?: boolean
}>()
const settingsStore = useSettingsStore()
const scaleRef = useTemplateRef("scale")

const hideSub = computed<CSSProperties>(() => (props.hideSubmenu ? { display: "none" } : {}))
const handlerStyle = ref<CSSProperties>({})
settingsStore.api.dataWatcher<Record<string, SettingsValue>>(props.id, handlerStyle, {
  width: "300px",
})
</script>
<template>
  <div class="subnav-container">
    <div class="subnav-provider" :style="[hideSub, handlerStyle]" ref="scale">
      <el-card class="subnav-card" body-class="flex flex-1 flex-col overflow-hidden" shadow="never">
        <slot name="submenu"></slot>
      </el-card>
      <Resize
        v-model="handlerStyle"
        size="8px"
        direction="r"
        :target="scaleRef"
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
  background-color: var(--el-fill-color-blank);
  .subnav-provider {
    overflow: hidden;
    min-width: 20rem;
    background-color: var(--el-fill-color);
    display: flex;
    flex-direction: column;
    border-right: solid 1px var(--el-border-color-lighter);
    position: relative;
  }
  .subnav-card {
    --el-card-border-color: transparent;
    --el-card-border-radius: 0;
    --el-card-padding: 0.25rem;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    overflow: hidden;
  }
  .subnav-content {
    background-color: var(--el-fill-color);
    overflow: hidden;
    display: flex;
    flex: 1;
  }
}
</style>
