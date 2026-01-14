<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp"
import { useSchemaValidate, MCPServerParam } from "@windflow/shared"
import { CallBackFn, errorToText, isArrayLength } from "@toolmain/shared"
import { msg, msgError } from "@renderer/utils"
import { storeToRefs } from "pinia"
import { assembleParam, McpServerInnerSchema, McpServersSchema } from "../helper"
import { DialogPanel } from "@toolmain/components"
const emit = defineEmits<{
  close: []
}>()
const { t } = useI18n()
const schema = useSchemaValidate()

const editorValue = ref(`/**
// -----
example1:
{
  "mcpServers": {
    "fetch": {
      "args": [
        "mcp-server-fetch"
      ],
      "command": "uvx"
    }
  }
}
// -----
example2:
{
  "fetch": {
    "args": [
      "mcp-server-fetch"
    ],
    "command": "uvx"
  }
}
*/
`)
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const onEditorChange = (val: string) => {
  editorValue.value = val
}
const handler = {
  parseRule1(changedData: Record<string, Record<string, MCPServerParam["params"]>>): MCPServerParam[] {
    const [ok, error] = schema.validate(McpServersSchema, changedData)
    if (!ok) {
      msgError(errorToText(error))
      return []
    }
    if (Object.hasOwn(changedData, "mcpServers")) {
      return Object.entries(changedData.mcpServers).map(([name, value]) => {
        return assembleParam(name, value, servers.value, mcp)
      })
    }
    return []
  },
  parseRule2(changedData: Record<string, MCPServerParam["params"]>): MCPServerParam[] {
    const [ok, error] = schema.validate(McpServerInnerSchema, changedData)
    if (!ok) {
      msgError(errorToText(error))
      return []
    }
    return Object.entries(changedData).map(([name, value]) => {
      return assembleParam(name, value, servers.value, mcp)
    })
  },
  save: async (done: CallBackFn) => {
    try {
      let data: MCPServerParam[] = []
      const changedData: Record<string, any> = JSON.parse(toValue(editorValue))
      if (Object.hasOwn(changedData, "mcpServers")) {
        data = handler.parseRule1(changedData)
      } else {
        data = handler.parseRule2(changedData)
      }
      if (!isArrayLength(data)) {
        return
      }
      await mcp.bulkAdd(data)
      msg(t("tip.saveSuccess"), "success")
      handler.close()
      done()
    } catch (error) {
      msg(errorToText(error), "error")
    } finally {
      done()
    }
  },
  close: () => {
    emit("close")
  },
}
</script>
<template>
  <DialogPanel>
    <MonacoEditor
      :value="editorValue"
      @change="onEditorChange"
      namespace="mcp"
      lang="json"
      filename="mcpServer2.json"></MonacoEditor>
    <template #footer>
      <div class="flex gap1rem justify-end">
        <Button type="primary" @click="handler.save">{{ t("btn.save") }}</Button>
        <el-button @click="handler.close">{{ t("btn.close") }}</el-button>
      </div>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
