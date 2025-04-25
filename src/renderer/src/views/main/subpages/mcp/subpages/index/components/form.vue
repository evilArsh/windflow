<script lang="ts" setup>
import { CallBackFn } from "@renderer/lib/shared/types"
import DialogPanel from "@renderer/components/DialogPanel/index.vue"
import { MCPStdioServer } from "@renderer/types"
import { cloneDeep } from "lodash-es"
import { FormRules } from "element-plus"
import { argsToArray, envToRecord } from "../../../utils"
const props = defineProps<{
  data?: MCPStdioServer
}>()
const emit = defineEmits<{
  close: []
  change: [MCPStdioServer]
}>()
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
    args.value = argsToArray(clonedData.value.args).join(" ")
    env.value = Object.entries(envToRecord(clonedData.value.env))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")
  },
  save: async (done: CallBackFn) => {
    if (!formRef.value) {
      done()
      return
    }
    formRef.value.validate(async valid => {
      if (valid) {
        const res = cloneDeep(clonedData.value)
        emit("change", res)
        emit("close")
      }
      done()
    })
  },
  close: () => {
    emit("close")
  },
  onArgsChange(val: string) {
    clonedData.value.args = argsToArray(val)
    handler.onDataChange()
  },
  onEnvChange(val: string) {
    clonedData.value.env = envToRecord(val)
    handler.onDataChange()
  },
  onDataChange() {
    formRef.value?.validate(valid => {
      valid && emit("change", clonedData.value)
    })
  },
}
watch(() => props.data, handler.init, { immediate: true })
</script>
<template>
  <DialogPanel>
    <el-form ref="form" :rules="formRules" :model="clonedData" label-width="10rem" class="w-full" label-position="top">
      <el-form-item :label="t('mcp.serverName')" required prop="serverName">
        <el-input @change="handler.onDataChange" v-model="clonedData.serverName"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.command')" required prop="command">
        <el-input @change="handler.onDataChange" v-model="clonedData.command"></el-input>
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
        <el-input @change="handler.onDataChange" v-model="clonedData.cwd"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.desc')" prop="description">
        <el-input
          @change="handler.onDataChange"
          v-model="clonedData.description"
          :autosize="{ minRows: 5 }"
          type="textarea"></el-input>
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
