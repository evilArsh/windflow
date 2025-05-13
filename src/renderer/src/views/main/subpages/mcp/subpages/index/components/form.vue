<script lang="ts" setup>
import Args from "./args.vue"
import Env from "./env.vue"
import DialogPanel from "@renderer/components/DialogPanel/index.vue"
import { CallBackFn } from "@renderer/lib/shared/types"
import { cloneDeep } from "lodash-es"
import { FormRules } from "element-plus"
import { MCPServerParam } from "@shared/types/mcp"
const props = defineProps<{
  data?: MCPServerParam
}>()
const emit = defineEmits<{
  close: []
  change: [MCPServerParam]
}>()
const { t } = useI18n()
const formRef = useTemplateRef("form")
const formRules = ref<FormRules>({
  serverName: {
    required: true,
    message: "",
    trigger: "blur",
    validator: (_, v: string, cb) => {
      cb(v.trim().length > 0 ? undefined : new Error(t("form.requiredValue")))
    },
  },
  "params.command": {
    required: true,
    trigger: "blur",
    validator: (_, v: string, cb) => {
      cb(v.trim().length > 0 ? undefined : new Error(t("form.requiredValue")))
    },
  },
  "params.args": {
    required: true,
    trigger: "blur",
    validator: (_, v: Array<string | number>, cb) => {
      if (v.length === 0) return cb(new Error(t("form.emptyValue")))
      cb(v.every(v => isNumber(v) || v) ? undefined : new Error(t("form.emptyValue")))
    },
  },
  "params.env": {
    trigger: "blur",
    validator: (_, v: Record<string, unknown>, cb) => {
      cb(Object.keys(v).every(key => key && (isNumber(v[key]) || v[key])) ? undefined : new Error(t("form.emptyValue")))
    },
  },
  "params.url": {
    required: true,
    trigger: "blur",
    validator: (_, value, cb) => {
      try {
        new URL(value)
        cb()
      } catch {
        cb(new Error(t("form.invalidUrl")))
      }
    },
  },
  type: { required: true, message: "", trigger: "blur" },
})
const defaultData = (): MCPServerParam => ({
  id: "",
  serverName: "",
  type: "stdio",
  params: { command: "", args: [], env: {} },
  description: "",
})
const clonedData = ref<MCPServerParam>(defaultData())
const handler = {
  async init() {
    await nextTick()
    clonedData.value = cloneDeep(props.data ?? defaultData())
  },
  save: async (done: CallBackFn) => {
    try {
      await formRef.value?.validate()
      emit("change", clonedData.value)
      emit("close")
      done()
    } catch (error) {
      console.log(error)
      done()
    }
  },
  close: () => {
    emit("close")
  },
}
watch(
  () => props.data,
  (val, old) => {
    if (val === old) return
    handler.init()
  },
  { immediate: true }
)
</script>
<template>
  <DialogPanel>
    <el-form ref="form" :rules="formRules" :model="clonedData" label-width="8rem" class="w-full">
      <el-form-item :label="t('mcp.serverName')" required prop="serverName">
        <el-input v-model="clonedData.serverName"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.type')" required prop="type">
        <el-radio-group v-model="clonedData.type">
          <el-radio-button label="stdio" value="stdio" />
          <el-radio-button label="streamable" value="streamable" />
          <el-radio-button label="sse" value="sse" />
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="t('mcp.enable')" prop="disabled">
        <el-switch v-model="clonedData.disabled" :active-value="false" :inactive-value="true" />
      </el-form-item>
      <template v-if="clonedData.type === 'stdio'">
        <el-form-item :label="t('mcp.command')" required prop="params.command">
          <el-input v-model="clonedData.params.command"></el-input>
        </el-form-item>
        <el-form-item :label="t('mcp.args')" required prop="params.args">
          <Args :model-value="clonedData.params.args"></Args>
        </el-form-item>
        <el-form-item :label="t('mcp.env')" prop="params.env">
          <Env v-model="clonedData.params.env"></Env>
        </el-form-item>
        <el-form-item :label="t('mcp.cwd')" prop="params.cwd">
          <el-input v-model="clonedData.params.cwd"></el-input>
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item :label="t('mcp.url')" prop="params.url">
          <el-input v-model="clonedData.params.url"></el-input>
        </el-form-item>
      </template>
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
