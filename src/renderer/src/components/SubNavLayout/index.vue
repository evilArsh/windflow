<script lang="ts" setup>
import { CSSProperties } from "@renderer/lib/shared/types"
import useSettingsStore from "@renderer/store/settings.store"
import { SettingsValue } from "@renderer/types"
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
      <slot name="submenu"></slot>
      <Resize v-model="handlerStyle" size="8px" direction="r" :target="scaleRef" />
    </div>
    <div class="subnav-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.subnav-container {
  --subnav-container-bg-color: transparent;
  --subnav-provider-bg-color: #efefef;
  --subnav-provider-border-color: #d9d9d9;
  --subnav-container-content-bg-color: #fdfdfd;

  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--subnav-container-bg-color);
  .subnav-provider {
    overflow: hidden;
    min-width: 20rem;
    background-color: var(--subnav-provider-bg-color);
    display: flex;
    flex-direction: column;
    border-right: solid 1px var(--subnav-provider-border-color);
    position: relative;
  }
  .subnav-content {
    flex-shrink: 0;
    background-color: var(--subnav-container-content-bg-color);
    overflow: hidden;
    display: flex;
    flex: 1;
  }
}
</style>
