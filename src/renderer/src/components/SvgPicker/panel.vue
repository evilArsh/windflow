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
const useQuery = () => {
  const params = reactive({
    from: 0,
    length: 0,
  })
  function reset() {
    params.from = 0
    params.length = 150
    iconList.value = []
    onQuery()
  }
  function onQuery() {
    const subIconSet = getSubIconSet(props.iconMap, props.iconsKeys, params.from, params.length)
    if (subIconSet) {
      iconList.value = iconList.value.concat(Object.keys(subIconSet.icons).map(set => getIconHTML(props.iconMap, set)))
    }
  }
  function onSearch() {
    useThrottleFn(
      () => {
        searchList.value = searchIcon(props.iconMap, props.iconsKeys, props.keyword)
      },
      1000,
      true
    )
  }
  function onList() {
    params.from += params.length
    onQuery()
  }
  function init() {
    reset()
  }
  return { params, init, reset, onQuery, onSearch, onList }
}
const query = useQuery()

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
