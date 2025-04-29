<script setup lang="ts">
import { Role } from "@renderer/types"
import { ChatMessageData } from "@renderer/types/chat"
import ITerminal from "~icons/material-symbols/terminal"
const props = defineProps<{
  data: ChatMessageData
}>()
const calls = computed(() => {
  // TODO: 展示内容
  return (props.data.toolCallsChain ?? [])
    .filter(val => val.role === Role.Assistant)
    .map(call => {
      return call.tool_calls ?? []
    })
    .flat()
    .map(call => {
      return {
        name: call.function.name,
      }
    })
})
</script>
<template>
  <div class="flex flex-col gap.5rem my-1rem">
    <ContentBox v-for="call in calls" default-lock :key="call.name">
      <template #icon>
        <ITerminal class="text-1.4rem" />
      </template>
      <el-text size="small" type="info">MCP: {{ call.name }}</el-text>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped></style>
