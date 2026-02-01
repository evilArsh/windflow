<script setup lang="ts">
import { LLMToolCall, Message } from "@windflow/core/types"
import useMcpStore from "@renderer/store/mcp"
import { storeToRefs } from "pinia"
import { cloneDeep, isArray } from "@toolmain/shared"
import json5 from "json5"
import { Copy, Spinner } from "@toolmain/components"

const props = defineProps<{
  message: Message
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
const message = computed(() => props.message)
const callsData = ref<Record<string, CallStatus>>({})
const calls = computed(() => Object.values(callsData.value))
const { t } = useI18n()
const serverName = computed(() => (serverId: string) => servers.value.find(v => v.id === serverId)?.name ?? "")
watch(
  () => message.value.tool_calls,
  v => {
    if (!isArray(v) || !v.length) {
      callsData.value = {}
      return
    }
    v.forEach(call => {
      if (!call.id) return
      if (!callsData.value[call.id]) {
        callsData.value[call.id] = {
          function: {
            arguments: "",
            name: call.function.name,
          },
          type: "function",
          serverId: call.serverId,
          content: "",
          status: Status.InProgress,
        }
      }
      Object.assign(callsData.value[call.id], cloneDeep(call))
    })
  },
  { deep: true, immediate: true }
)
watch(
  () => message.value.tool_calls_chain,
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
const str2Obj = (str?: string) => {
  try {
    if (!str) return
    return json5.parse(str)
  } catch (_) {
    return str
  }
}
const transferJson = (str: string): string => {
  try {
    const json = json5.parse(str)
    if (isArray(json)) {
      for (let i = 0; i < json.length; i++) {
        json[i].text = str2Obj(json[i].text)
      }
    } else {
      json.text = str2Obj(json.text)
    }
    return json5.stringify(json, null, 2)
    //     return `\`\`\`json
    // ${json5.stringify(json, null, 2)}
    // \`\`\``
  } catch (_) {
    return str
  }
}
</script>
<template>
  <div v-if="calls.length > 0">
    <el-collapse class="w-full" border="solid 1px [var(--el-collapse-border-color)]" expand-icon-position="right">
      <el-collapse-item v-for="call in calls" :key="call.id" :name="call.id">
        <template #title>
          <div class="flex items-center gap-0.5rem px-1.5rem">
            <Spinner
              destroy-icon
              :model-value="call.status === Status.InProgress"
              class="flex-shrink-0 text-1.2rem font-bold"></Spinner>
            <i-twemoji-hammer-and-wrench class="text-1.2rem" />
            <el-text type="primary">{{ serverName(call.serverId) }}</el-text>
            <el-text type="danger">|</el-text>
            <el-text type="info">{{ call.function.name }}</el-text>
          </div>
        </template>
        <div class="flex flex-col gap.5rem max-h-30rem overflow-auto">
          <ContentBox class="select-unset! cursor-unset!" normal>
            <el-space>
              <el-text type="primary">{{ t("chat.mcpCall.arguments") }}</el-text>
              <Copy :text="call.function.arguments"></Copy>
            </el-space>
            <template #footer>
              <Markdown force-plaintext :content="transferJson(call.function.arguments)"></Markdown>
            </template>
          </ContentBox>
          <ContentBox class="select-unset! cursor-unset!" normal>
            <el-space>
              <el-text type="primary">{{ t("chat.mcpCall.content") }}</el-text>
              <Copy :text="call.content"></Copy>
            </el-space>
            <template #footer>
              <Markdown force-plaintext :content="transferJson(call.content)"></Markdown>
            </template>
          </ContentBox>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<style lang="scss" scoped></style>
