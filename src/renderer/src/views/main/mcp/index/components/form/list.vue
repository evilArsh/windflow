<script lang="ts" setup>
import MonacoEditor from "@renderer/components/MonacoEditor/index.vue"
import useMcpStore from "@renderer/store/mcp"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, errorToText, msg, msgError } from "@toolmain/shared"
import { storeToRefs } from "pinia"
import { MCPServerParam } from "@windflow/shared"
import { useI18n } from "vue-i18n"
import { useSchemaValidate } from "@windflow/shared"
import { assembleParam, McpServersSchema } from "../helper"
type MCPServersConfig = { mcpServers: Record<string, MCPServerParam["params"]> }
const emit = defineEmits<{
  close: []
}>()
const data = reactive<MCPServersConfig>({
  mcpServers: {},
})
const mcp = useMcpStore()
const schema = useSchemaValidate()
const { servers } = storeToRefs(mcp)
const { t } = useI18n()
const editorValue = ref("") // 编辑器内容
const onEditorChange = (val: string) => {
  editorValue.value = val
}
const handler = {
  // 所有mcp配置组装成json,组装时隐藏id
  async init() {
    try {
      const res = await mcp.getAll()
      data.mcpServers = res.reduce<MCPServersConfig["mcpServers"]>((pre, cur) => {
        const name = cur.name
        pre[name] = cur.params
        return pre
      }, {})
      editorValue.value = JSON.stringify(toRaw(data), null, 2)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  save: async (done: CallBackFn) => {
    try {
      const changedData: MCPServersConfig = JSON.parse(toValue(editorValue))
      const [ok, error] = schema.validate(McpServersSchema, changedData)
      if (!ok) {
        msgError(errorToText(error))
        return
      } else if (Object.hasOwn(changedData, "mcpServers")) {
        const res = Object.entries(changedData.mcpServers).map(([name, value]) => {
          return assembleParam(name, value, servers.value, mcp)
        })
        await mcp.bulkAdd(res)
        msg({ code: 200, msg: t("tip.saveSuccess") })
      }
      emit("close")
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      done()
    }
  },
  close: () => {
    emit("close")
  },
}
onMounted(handler.init)
</script>
<template>
  <DialogPanel>
    <template #header>
      <el-text type="primary" size="large">{{ t("mcp.service.configList") }}</el-text>
    </template>
    <MonacoEditor
      :value="editorValue"
      @change="onEditorChange"
      namespace="mcp"
      lang="json"
      filename="mcpServer.json"></MonacoEditor>
    <template #footer>
      <div class="flex gap1rem justify-end">
        <Button type="primary" @click="handler.save">{{ t("btn.save") }}</Button>
        <el-button @click="handler.close">{{ t("btn.close") }}</el-button>
      </div>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
