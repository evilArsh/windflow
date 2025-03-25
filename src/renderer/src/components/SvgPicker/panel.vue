<script setup lang="ts">
import type { IconifyJSON } from "@iconify/types"
import { getIconData, getIcons, iconToSVG, iconToHTML } from "@iconify/utils"
const props = defineProps<{
  iconMap: IconifyJSON
}>()
const emit = defineEmits<{
  (e: "change", value: string): void
}>()
const allIconKeys = shallowRef<string[]>([]) // icon key
const iconList = shallowRef<string[]>([]) // icon data
const query = reactive({
  from: 0,
  length: 0,
  reset: markRaw(() => {
    query.from = 0
    query.length = 150
    query.onQuery()
  }),
  onQuery: markRaw(() => {
    const subIconSet = getIcons(
      props.iconMap as IconifyJSON,
      allIconKeys.value.slice(query.from, query.from + query.length)
    )

    if (subIconSet) {
      iconList.value = Object.keys(subIconSet.icons).map(set => {
        const svg = iconToSVG(getIconData(subIconSet, set)!)
        return iconToHTML(svg.body, svg.attributes)
      })
    }
  }),
  init: markRaw(() => {
    allIconKeys.value = Object.keys(props.iconMap.icons)
    query.reset()
  }),
})

watch(
  () => props.iconMap,
  () => {
    query.init()
  },
  { immediate: true }
)
</script>
<template>
  <el-scrollbar height="30rem">
    <div class="flex flex-wrap w-full h-full">
      <div v-for="(item, index) in iconList" :key="index" class="w4rem h4rem p-0.5rem flex-shrink0">
        <el-button class="w-full h-full inline-block" @click="emit('change', item)">
          <Svg class="text-25px" :src="item"></Svg>
        </el-button>
      </div>
    </div>
  </el-scrollbar>
</template>
