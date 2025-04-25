<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp.store"
import { CallBackFn } from "@renderer/lib/shared/types"
import DialogPanel from "@renderer/components/DialogPanel/index.vue"
import { MCPStdioServer } from "@renderer/types"
import { cloneDeep } from "lodash"
import { FormRules } from "element-plus"
import { storeToRefs } from "pinia"
import { errorToText } from "@shared/error"
const props = defineProps<{
  data?: MCPStdioServer
}>()
const emit = defineEmits<{
  close: []
  change: [MCPStdioServer]
}>()
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const { t } = useI18n()
const formRef = useTemplateRef("form")
const formRules = reactive<FormRules>({
  command: {
    required: true,
    message: "",
    trigger: "blur",
    validator: (_, v: string, cb) => {
      cb(v.trim().length > 0 ? undefined : new Error())
    },
  },
  serverName: {
    required: true,
    message: "",
    trigger: "blur",
    validator: (_, v: string, cb) => {
      cb(v.trim().length > 0 ? undefined : new Error())
    },
  },
  args: { required: true, message: "", trigger: "blur" },
})
const clonedData = ref<MCPStdioServer>({
  id: "",
  command: "",
  serverName: "",
})
const args = ref("")
const env = ref("")
const handler = {
  async init() {
    await nextTick()
    clonedData.value = cloneDeep(
      props.data ??
        ({
          command: "",
          serverName: "",
        } as MCPStdioServer)
    )
    args.value = (clonedData.value.args ?? []).join(" ")
    env.value = Object.entries(clonedData.value.env ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")
  },
  save: async (done: CallBackFn) => {
    if (!formRef.value) {
      done()
      return
    }
    formRef.value.validate(async valid => {
      try {
        if (valid) {
          if (!clonedData.value.id) {
            clonedData.value.id = uniqueId()
            await mcp.api.add(cloneDeep(clonedData.value))
            servers.value.push(cloneDeep(clonedData.value))
          } else {
            const res = cloneDeep(clonedData.value)
            await mcp.api.update(cloneDeep(clonedData.value))
            emit("change", res)
          }
          emit("close")
        }
      } catch (error) {
        msg({ code: 500, msg: errorToText(error) })
      } finally {
        done()
      }
    })
  },
  close: () => {
    emit("close")
  },
  onArgsChange(val: string) {
    clonedData.value.args = val.split(/[\n\s]+/).filter(Boolean)
  },
  onEnvChange(val: string) {
    clonedData.value.env = val
      .split(/[\n\s]+/)
      .filter(Boolean)
      .reduce((prev, cur) => {
        const [key, value] = cur.split("=")
        if (key && value) {
          prev[key] = value
        }
        return prev
      }, {})
  },
}
watch(() => props.data, handler.init, { immediate: true })
</script>
<template>
  <DialogPanel class="h-70vh">
    <el-form ref="form" :rules="formRules" :model="clonedData" label-width="10rem" class="w-full" label-position="top">
      <el-form-item :label="t('mcp.serverName')" required prop="serverName">
        <el-input v-model="clonedData.serverName"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.command')" required prop="command">
        <el-input v-model="clonedData.command"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.args')" required prop="args">
        <el-input v-model="args" :autosize="{ minRows: 5 }" type="textarea" @change="handler.onArgsChange"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.env')" prop="env">
        <el-input
          v-model="env"
          @change="handler.onEnvChange"
          placeholder="key=value"
          type="textarea"
          :autosize="{ minRows: 5 }"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.cwd')" prop="cwd">
        <el-input v-model="clonedData.cwd"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.desc')" prop="description">
        <el-input v-model="clonedData.description" :autosize="{ minRows: 5 }" type="textarea"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex gap1rem justify-end">
        <Button type="primary" @click="handler.save">{{ t("btn.save") }}</Button>
        <el-button @click="handler.close">{{ t("btn.close") }}</el-button>
      </div>
    </template>
  </DialogPanel>
</template>
