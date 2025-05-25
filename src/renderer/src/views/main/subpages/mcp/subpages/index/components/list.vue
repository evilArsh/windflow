<script lang="ts" setup>
import MonacoEditor from "@renderer/components/MonacoEditor/index.vue"
import useMcpStore from "@renderer/store/mcp"
import DialogPanel from "@renderer/components/DialogPanel/index.vue"
import { errorToText } from "@shared/error"
import { storeToRefs } from "pinia"
import { cloneDeep } from "lodash-es"
import { MCPServerParam } from "@shared/types/mcp"
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
      const res = await mcp.api.getAll()
      data.mcpServers = res.reduce<MCPServersConfig["mcpServers"]>((pre, cur) => {
        const serverName = cur.serverName
        pre[serverName] = cur.params
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
      for (const [serverName, value] of Object.entries(changedData.mcpServers)) {
        // @ts-expect-error known property
        if (!isObject(value.env)) value.env = {}
        // @ts-expect-error known property
        if (!isArray(value.args)) value.args = []
        // @ts-expect-error known property
        if (!isValidUrl(value.url)) {
          delete value["url"]
        }
        const existed: MCPServerParam | undefined = servers.value.find(v => v.serverName === serverName)
        if (existed) {
          existed.params = value
          const res = await mcp.api.update(cloneDeep(existed))
          if (res == 0) {
            throw new Error(`update ${serverName} failed`)
          }
        } else {
          const newValue = cloneDeep<MCPServerParam>({
            id: uniqueId(),
            serverName,
            type: Object.hasOwn(value, "url") ? "streamable" : "stdio",
            params: value as any,
            description: "",
          })
          const res = await mcp.api.add(newValue)
          if (res == 0) {
            throw new Error(`add ${serverName} failed`)
          }
          servers.value.push(newValue)
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
