<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import ShortCut from "./shortcut.vue"
const props = defineProps<{
  topic: ChatTopic
}>()
const _topicData = computed<ChatTopic>(() => props.topic)
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <ShortCut></ShortCut>
  </div>
</template>
<style lang="scss" scoped></style>
