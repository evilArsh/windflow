<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import ITerminal from "~icons/material-symbols/terminal"
const props = defineProps<{
  data: ChatMessageData
}>()
const calls = computed(() => {
  return props.data.content.tool_calls ?? []
})
</script>
<template>
  <div v-if="calls.length > 0" class="flex flex-col gap.5rem my-1rem">
    <ContentBox v-for="call in calls" default-lock :key="call.id">
      <template #icon>
        <ITerminal class="text-1.4rem" />
      </template>
      <el-text size="small" type="info">{{ call.function.name }}</el-text>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped></style>
