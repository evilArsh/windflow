<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import ITerminal from "~icons/material-symbols/terminal"
defineProps<{
  data: ChatMessageData
}>()
</script>
<template>
  <div v-if="data.content.tool_calls" class="flex flex-col gap.5rem my-1rem">
    <ContentBox v-for="call in data.content.tool_calls" default-lock :key="call.function.name">
      <template #icon>
        <ITerminal class="text-1.4rem" />
      </template>
      <el-text size="small" type="info">MCP: {{ call.function.name }}</el-text>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped></style>
