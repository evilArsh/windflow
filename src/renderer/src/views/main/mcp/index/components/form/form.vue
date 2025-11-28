<script lang="ts" setup>
import Args from "./args.vue"
import Env from "./env.vue"
import useMcpStore from "@renderer/store/mcp"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, isNumber, isHTTPUrl, cloneDeep } from "@toolmain/shared"
import { FormProps, FormRules } from "element-plus"
import { MCPServerParam } from "@shared/types/mcp"

const props = defineProps<{
  size?: "" | "default" | "small" | "large"
  nameEditable?: boolean
  hideCloseBtn?: boolean
  data?: MCPServerParam
  formProps?: Partial<FormProps>
}>()
const emit = defineEmits<{
  close: []
  change: [MCPServerParam]
}>()
const { t } = useI18n()
const mcp = useMcpStore()
const formRef = useTemplateRef("form")
const formRules = ref<FormRules>({
  name: {
    required: true,
    trigger: "blur",
    validator: (_, v: string, cb) => {
      cb(v.trim().length > 0 ? undefined : new Error(t("form.emptyValueNotAllowed")))
    },
  },
  "params.command": {
    required: true,
    trigger: "blur",
    validator: (_, v: string, cb) => {
      cb(v.trim().length > 0 ? undefined : new Error(t("form.valueRequired")))
    },
  },
  "params.args": {
    required: true,
    trigger: "blur",
    validator: (_, v: Array<string | number>, cb) => {
      if (v.length === 0) return cb(new Error(t("form.emptyValueNotAllowed")))
      cb(v.every(v => isNumber(v) || v) ? undefined : new Error(t("form.emptyValueNotAllowed")))
    },
  },
  "params.env": {
    trigger: "blur",
    validator: (_, v: Record<string, unknown>, cb) => {
      cb(
        Object.keys(v).every(key => key && (isNumber(v[key]) || v[key]))
          ? undefined
          : new Error(t("form.emptyValueNotAllowed"))
      )
    },
  },
  "params.url": {
    required: true,
    trigger: "blur",
    validator: (_, value, cb) => {
      cb(isHTTPUrl(value) ? undefined : new Error(t("form.urlInvalid")))
    },
  },
  type: { required: true, message: "", trigger: "blur" },
})
const defaultData = (): MCPServerParam => ({
  id: "",
  name: "",
  label: "",
  type: "stdio",
  referTopics: [],
  params: { url: "", command: "", args: [], env: {} },
  description: "",
  timeout: 60000,
})
const clonedData = ref<MCPServerParam>(defaultData())
const handler = {
  async validate() {
    await formRef.value?.validate()
  },
  async init() {
    clonedData.value = props.data ? mcp.clonePure(props.data) : defaultData()
  },
  save: async (done: CallBackFn) => {
    try {
      await handler.validate()
      emit("change", cloneDeep(clonedData.value))
      handler.close()
      done()
    } catch (error) {
      console.log(error)
      done()
    }
  },
  close: () => {
    clonedData.value = defaultData()
    emit("close")
  },
}
watch(() => props.data, handler.init, { immediate: true, deep: true })
defineExpose({
  validate: handler.validate,
})
</script>
<template>
  <DialogPanel>
    <el-form
      ref="form"
      :size
      :rules="formRules"
      :model="clonedData"
      label-width="8rem"
      class="w-full"
      v-bind="formProps">
      <el-form-item :label="t('mcp.name')" required prop="name">
        <el-input :disabled="!nameEditable" v-model.trim="clonedData.name"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.label')" required prop="label">
        <el-input v-model.trim="clonedData.label"></el-input>
      </el-form-item>
      <el-form-item :label="t('mcp.type')" required prop="type">
        <el-radio-group v-model="clonedData.type">
          <el-radio-button label="stdio" value="stdio" />
          <el-radio-button label="streamable" value="streamable" />
          <el-radio-button label="sse" value="sse" />
        </el-radio-group>
      </el-form-item>
      <template v-if="clonedData.type === 'stdio'">
        <el-form-item :label="t('mcp.command')" required prop="params.command">
          <el-select v-model="clonedData.params.command">
            <el-option label="npx" value="npx"></el-option>
            <el-option label="uv(x)" value="uv"></el-option>
          </el-select>
          <!-- <el-input v-model="clonedData.params.command"></el-input> -->
        </el-form-item>
        <el-form-item :label="t('mcp.args')" required prop="params.args">
          <Args :model-value="clonedData.params.args"></Args>
        </el-form-item>
        <!-- <el-form-item :label="t('mcp.timeout')" prop="params.env">
          <div class="flex-y-center gap-[var(--ai-gap-base)]">
            <el-input-number v-model="clonedData.timeout"></el-input-number>
          </div>
        </el-form-item> -->
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
      <div class="flex justify-end">
        <Button :size type="primary" @click="handler.save">{{ t("btn.save") }}</Button>
        <el-button v-if="!hideCloseBtn" :size @click="handler.close">{{ t("btn.close") }}</el-button>
      </div>
    </template>
  </DialogPanel>
</template>
