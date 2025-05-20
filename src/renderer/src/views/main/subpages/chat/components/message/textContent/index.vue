<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import Single from "./single.vue"
import Multiple from "./multiple.vue"
import Divider from "./divider.vue"
const props = defineProps<{
  data: ChatMessageData
}>()
const hasChildren = computed(() => {
  return isArray(props.data.children) && props.data.children.length > 0
})
</script>
<template>
  <Divider v-if="data.contextFlag" :data></Divider>
  <Multiple v-else-if="hasChildren" :parent="data" :data="data.children ?? []"></Multiple>
  <Single v-else :data header></Single>
</template>
<style lang="scss" scoped></style>
