<script setup lang="ts">
import SvgPanel from "./panel.vue"
import { iconMap } from "./index"
import { providerSvgIconKey } from "@renderer/app/element/usable/useSvgIcon"
import Svg from "@renderer/components/Svg/index.vue"
import { IconifyJSON } from "@iconify/types"
import { getIconHTML } from "./index"
const providerSvgIcon = inject(providerSvgIconKey)
defineProps<{
  modelValue: string
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const key = ref("")
const tabs = reactive({
  active: "fluentEmojiFlat",
})
iconMap.provider = {
  title: h(Svg, { style: "font-size: 3rem", src: getIconHTML(providerSvgIcon as IconifyJSON, "deepseek") }),
  icons: providerSvgIcon as IconifyJSON,
  iconsKeys: Object.keys((providerSvgIcon as IconifyJSON).icons),
}
</script>
<template>
  <div class="flex flex-col gap-1rem w-full">
    <div class="flex gap-1rem">
      <el-button class="w-3.5rem h-3.5rem">
        <Svg :src="modelValue" class="text-25px"></Svg>
      </el-button>
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
      @change="emit('update:modelValue', $event)"></SvgPanel>
  </div>
</template>
<style lang="scss" scoped>
.emoji-tabs.el-tabs {
  :deep(.el-tabs__item) {
    padding: 0 5px;
  }
}
</style>
