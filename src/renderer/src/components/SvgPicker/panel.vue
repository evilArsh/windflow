<script setup lang="ts">
import type { IconifyJSON } from "@iconify/types"
import { getSubIconSet, getIconHTML, searchIcon } from "./index"
import { useScroll, useThrottleFn } from "@vueuse/core"
const props = defineProps<{
  iconMap: IconifyJSON
  iconsKeys: string[]
  keyword?: string
}>()
const emit = defineEmits<{
  (e: "change", value: string): void
}>()

const scrollRef = useTemplateRef("scroll")
const { arrivedState, y } = useScroll(() => scrollRef.value?.wrapRef, {
  behavior: "smooth",
})

const iconList = shallowRef<string[]>([]) // icon data
const searchList = shallowRef<string[]>([]) // search data
const filterList = computed(() => {
  if (props.keyword) {
    return searchList.value
  }
  return iconList.value
})
const query = reactive({
  from: 0,
  length: 0,
  reset: markRaw(() => {
    query.from = 0
    query.length = 150
    iconList.value = []
    query.onQuery()
  }),
  onQuery: markRaw(() => {
    const subIconSet = getSubIconSet(props.iconMap, props.iconsKeys, query.from, query.length)
    if (subIconSet) {
      iconList.value = iconList.value.concat(Object.keys(subIconSet.icons).map(set => getIconHTML(props.iconMap, set)))
    }
  }),
  onSearch: markRaw(
    useThrottleFn(
      () => {
        searchList.value = searchIcon(props.iconMap, props.iconsKeys, props.keyword)
      },
      1000,
      true
    )
  ),
  onList: markRaw(() => {
    query.from += query.length
    query.onQuery()
  }),
  init: markRaw(() => {
    query.reset()
  }),
})

watch(
  () => props.iconMap,
  () => {
    y.value = 0
    query.init()
  },
  { immediate: true }
)
watch(
  () => arrivedState.bottom,
  () => {
    query.onList()
  }
)
watch(
  () => props.keyword,
  () => {
    query.onSearch()
  }
)
</script>
<template>
  <el-scrollbar ref="scroll" height="30rem">
    <div class="flex flex-wrap w-full h-full">
      <div v-for="(item, index) in filterList" :key="index" class="min-w4rem min-h4rem p-0.5rem flex-shrink0">
        <el-button class="w-full h-full inline-block" @click="emit('change', item)">
          <Svg class="text-25px" :src="item"></Svg>
        </el-button>
      </div>
    </div>
  </el-scrollbar>
</template>
