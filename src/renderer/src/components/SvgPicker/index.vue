<script setup lang="ts">
import SvgPanel from "./panel.vue"
import { iconMap } from "./index"
import { providerSvgIconKey } from "@renderer/app/hooks/useSvgIcon"
import Svg from "@renderer/components/Svg/index.vue"
import { IconifyJSON } from "@iconify/types"
import { getIconHTML } from "./index"
import useScale from "./useScale"
import { ScaleInstance, ScalePanel } from "@toolmain/components"
const providerSvgIcon = inject(providerSvgIconKey)
defineProps<{
  modelValue: string
  /**
   * 该模式下只能通过暴露的方法调用
   */
  invokeMode?: boolean
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()
const scaleRef = useTemplateRef<ScaleInstance>("scale")
const svgRef = useTemplateRef("svgRef")

const key = ref("")
const tabs = reactive({
  active: "fluentEmojiFlat",
})
const { panelConfig, open, clickMask } = useScale(scaleRef, svgRef)
iconMap.provider = {
  title: h(Svg, { style: "font-size: 3rem", src: getIconHTML(providerSvgIcon as IconifyJSON, "deepseek-color") }),
  icons: providerSvgIcon as IconifyJSON,
  iconsKeys: Object.keys((providerSvgIcon as IconifyJSON).icons),
}
defineExpose({
  open,
})
</script>
<template>
  <div>
    <ContentBox
      v-if="!invokeMode"
      @click.stop="e => open(e.clientX, e.clientY)"
      class="w-3rem h-3rem flex items-center justify-center">
      <Svg :src="modelValue" class="text-25px"></Svg>
    </ContentBox>
    <teleport to="body">
      <ScalePanel v-model="panelConfig" ref="scale" @mask-click="clickMask">
        <el-card style="--el-card-padding: 0" shadow="never">
          <div ref="svgRef" class="flex flex-col gap-1rem p1.5rem w-full h-full">
            <div class="flex gap-1rem">
              <el-input v-model="key"></el-input>
            </div>
            <el-tabs class="emoji-tabs" v-model="tabs.active">
              <el-tab-pane v-for="(item, name) in iconMap" :label="name" :name="name" :key="name">
                <template #label>
                  <el-button>
                    <component class="text-20px" :is="item.title"></component>
                  </el-button>
                </template>
              </el-tab-pane>
            </el-tabs>
            <SvgPanel
              :icon-map="iconMap[tabs.active].icons"
              :icons-keys="iconMap[tabs.active].iconsKeys"
              :keyword="key"
              @change="emit('update:modelValue', $event)"></SvgPanel>
          </div>
        </el-card>
      </ScalePanel>
    </teleport>
  </div>
</template>
<style lang="scss" scoped>
.emoji-tabs.el-tabs {
  :deep(.el-tabs__item) {
    padding: 0 5px;
  }
}
</style>
