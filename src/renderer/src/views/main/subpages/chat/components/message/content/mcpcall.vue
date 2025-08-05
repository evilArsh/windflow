<script setup lang="ts">
import { LLMToolCall } from "@renderer/types"
import { ChatMessage } from "@renderer/types/chat"
import useMcpStore from "@renderer/store/mcp"
import { storeToRefs } from "pinia"
import { useToolName } from "@shared/mcp"
import { cloneDeep } from "@shared/utils"
import PureCode from "@renderer/components/Markdown/components/PureCode/index.vue"
import json5 from "json5"
const props = defineProps<{
  message: ChatMessage
}>()
type CallStatus = LLMToolCall & {
  status: Status
  content: string
  serverId: string
}
enum Status {
  InProgress = "inProgress",
  Completed = "completed",
}
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const callsData = ref<Record<string, CallStatus>>({})
const calls = computed(() => Object.values(callsData.value))
const toolName = useToolName()
const { t } = useI18n()
const serverName = computed(() => (serverId: string) => servers.value.find(v => v.id === serverId)?.name ?? "")
watch(
  () => props.message.content.tool_calls,
  v => {
    if (!isArray(v) || !v.length) {
      callsData.value = {}
      return
    }
    v.forEach(call => {
      if (!call.id) return
      const { name, serverId } = toolName.split(call.function.name)
      if (!callsData.value[call.id]) {
        callsData.value[call.id] = {
          function: {
            arguments: "",
            name: "",
          },
          type: "function",
          serverId,

          content: "",
          status: Status.InProgress,
        }
      }
      Object.assign(callsData.value[call.id], cloneDeep(call))
      callsData.value[call.id].function.name = name
    })
  },
  { deep: true, immediate: true }
)
watch(
  () => props.message.content.tool_calls_chain,
  v => {
    if (!isArray(v)) return
    v.forEach(call => {
      if (!call.tool_call_id) return
      if (!callsData.value[call.tool_call_id]) return
      callsData.value[call.tool_call_id].status = Status.Completed
      callsData.value[call.tool_call_id].content = call.content as string
    })
  },
  { deep: true, immediate: true }
)
const tool = {
  transferJson(str: string) {
    try {
      return json5.stringify(json5.parse(str), null, 2)
    } catch (_) {
      return str
    }
  },
}
</script>
<template>
  <div v-if="calls.length > 0" class="my-1rem">
    <el-collapse expand-icon-position="left">
      <el-collapse-item v-for="call in calls" :key="call.id" :name="call.id">
        <template #title>
          <div class="flex items-center gap-0.5rem">
            <Spinner
              destroy-icon
              :model-value="call.status === Status.InProgress"
              class="flex-shrink-0 text-1.2rem font-bold"></Spinner>
            <i-twemoji:hammer-and-wrench class="text-1.2rem" />
            <el-text size="small" type="primary">{{ serverName(call.serverId) }}</el-text>
            <el-text size="small" type="danger">|</el-text>
            <el-text size="small" type="info">{{ call.function.name }}</el-text>
          </div>
        </template>
        <div class="flex flex-col gap.5rem">
          <ContentBox class="select-unset!">
            <el-text size="small" type="primary">{{ t("chat.mcpCall.arguments") }}</el-text>
            <template #footer>
              <el-text>
                <PureCode :code="tool.transferJson(call.function.arguments)" lang="json"></PureCode>
              </el-text>
            </template>
          </ContentBox>
          <ContentBox class="select-unset!">
            <el-text size="small" type="primary">{{ t("chat.mcpCall.content") }}</el-text>
            <template #footer>
              <el-text>
                <PureCode :code="tool.transferJson(call.content)" lang="json"></PureCode>
              </el-text>
            </template>
          </ContentBox>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<style lang="scss" scoped></style>
