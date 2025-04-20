<script lang="ts" setup>
import { CallBackFn } from "@renderer/lib/shared/types"
import { MCPStdioServer } from "@renderer/types"
import { cloneDeep } from "lodash"
import useMcpStore from "@renderer/store/mcp.store"
import { errorToText } from "@shared/error"
import { FormRules } from "element-plus"
const mcp = useMcpStore()
const props = defineProps<{
  data: MCPStdioServer
}>()
const emit = defineEmits<{
  (e: "change", value: MCPStdioServer): void
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
  command: "",
  serverName: "",
})
const args = ref("")
const env = ref("")
const handler = {
  async init() {
    await nextTick()
    clonedData.value = cloneDeep(props.data)
    args.value = (clonedData.value.args ?? []).join(" ")
    env.value = Object.entries(clonedData.value.env ?? {})
      .map(([key, value]) => `${key}:${value}`)
      .join("\n")
  },
  onArgsChange(val: string) {
    clonedData.value.args = val.split(/[\n\s]+/).filter(Boolean)
  },
  onEnvChange(val: string) {
    clonedData.value.env = val
      .split(/[\n\s]+/)
      .filter(Boolean)
      .reduce((prev, cur) => {
        const [key, value] = cur.split(":")
        if (key && value) {
          prev[key] = value
        }
        return prev
      }, {})
  },
  async onSave(done: CallBackFn) {
    formRef.value?.validate(async valid => {
      try {
        if (valid) {
          await mcp.api.update(cloneDeep(clonedData.value))
          emit("change", clonedData.value)
        }
      } catch (error) {
        msg({ code: 500, msg: errorToText(error) })
      } finally {
        done()
      }
    })
  },
}
watch(() => props.data, handler.init, { immediate: true })
</script>
<template>
  <div class="px-1rem flex-1">
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
          placeholder="key:value"
          type="textarea"
          :autosize="{ minRows: 5 }"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.cwd')" prop="cwd">
        <el-input v-model="clonedData.cwd"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.desc')" prop="description">
        <el-input v-model="clonedData.description"></el-input>
      </el-form-item>
      <el-form-item>
        <Button type="primary" @click="handler.onSave">{{ t("btn.save") }}</Button>
      </el-form-item>
    </el-form>
  </div>
</template>
