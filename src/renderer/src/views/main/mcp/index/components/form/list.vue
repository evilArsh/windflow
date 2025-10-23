<script lang="ts" setup>
import MonacoEditor from "@renderer/components/MonacoEditor/index.vue"
import useMcpStore from "@renderer/store/mcp"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, errorToText, isArray, isObject, isHTTPUrl, msg } from "@toolmain/shared"
import { storeToRefs } from "pinia"
import { MCPServerParam } from "@shared/types/mcp"
import { useI18n } from "vue-i18n"
type MCPServersConfig = { mcpServers: Record<string, MCPServerParam["params"]> }
const emit = defineEmits<{
  close: []
}>()
const data = reactive<MCPServersConfig>({
  mcpServers: {},
})
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const { t } = useI18n()
const value = ref("") // 编辑器内容
const onEditorChange = (val: string) => {
  value.value = val
}
const handler = {
  // 所有mcp配置组装成json,组装时隐藏id
  async init() {
    await nextTick()
    try {
      const res = await mcp.getAll()
      data.mcpServers = res.reduce<MCPServersConfig["mcpServers"]>((pre, cur) => {
        const name = cur.name
        pre[name] = cur.params
        return pre
      }, {})
      value.value = JSON.stringify(toRaw(data), null, 2)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  save: async (done: CallBackFn) => {
    try {
      const changedData: MCPServersConfig = JSON.parse(value.value)
      for (const [name, value] of Object.entries(changedData.mcpServers)) {
        if (!isObject(value.env)) value.env = {}
        if (!isArray(value.args)) value.args = []
        if (!isHTTPUrl(value.url)) {
          value.url = ""
        }
        const existed: MCPServerParam | undefined = servers.value.find(v => v.name === name)
        if (existed) {
          existed.params = value
          await mcp.update(mcp.clonePure(existed))
        } else {
          const newValue = mcp.clonePure({
            id: mcp.createNewId(),
            name,
            type: value.url ? "streamable" : "stdio",
            params: value as any,
            description: "",
          })
          await mcp.add(newValue)
        }
      }
      msg({ code: 200, msg: t("tip.saveSuccess") })
      emit("close")
      done()
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
    <MonacoEditor :value @change="onEditorChange" namespace="mcp" lang="json" filename="mcpServer.json"></MonacoEditor>
    <template #footer>
      <div class="flex gap1rem justify-end">
        <Button type="primary" @click="handler.save">{{ t("btn.save") }}</Button>
        <el-button @click="handler.close">{{ t("btn.close") }}</el-button>
      </div>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
