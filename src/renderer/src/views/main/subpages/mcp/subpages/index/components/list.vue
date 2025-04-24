<script lang="ts" setup>
import MonacoEditor from "@renderer/components/MonacoEditor/index.vue"
import useMcpStore from "@renderer/store/mcp.store"
import DialogPanel from "@renderer/components/DialogPanel/index.vue"
import { errorToText } from "@shared/error"
import { MCPStdioServer } from "@renderer/types"
// import { storeToRefs } from "pinia"
const emit = defineEmits<{
  close: []
}>()
const data = reactive({
  mcpServers: {} as Record<string, MCPStdioServer>,
})
const mcp = useMcpStore()
// const { servers } = storeToRefs(mcp)
const { t } = useI18n()

const value = ref("")
const handler = {
  async init() {
    await nextTick()
    try {
      const res = await mcp.api.getAll()
      data.mcpServers = res.reduce(
        (pre, cur) => {
          pre[cur.serverName] = cur
          return pre
        },
        {} as Record<string, MCPStdioServer>
      )
      value.value = JSON.stringify(toRaw(data), null, 2)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  save: async (done: CallBackFn) => {
    done()
  },
  close: () => {
    emit("close")
  },
}
onMounted(handler.init)
</script>
<template>
  <DialogPanel class="h-70vh">
    <MonacoEditor :value namespace="mcp" lang="json" filename="mcpServer.json"></MonacoEditor>
    <template #footer>
      <div class="flex gap1rem justify-end">
        <!-- <Button type="primary" @click="handler.save">{{ t("btn.save") }}</Button> -->
        <el-button @click="handler.close">{{ t("btn.close") }}</el-button>
      </div>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
