<script lang="ts" setup>
import { ModelMeta, ModelType } from "@windflow/core/types"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, cloneDeep, isArrayLength } from "@toolmain/shared"
import { Arrayable } from "@vueuse/core"
import { FormItemRule } from "element-plus"
const { t } = useI18n()
const emit = defineEmits<{
  close: []
  confirm: [model: ModelMeta, done: CallBackFn]
}>()
const props = defineProps<{
  model?: ModelMeta
}>()
const formRef = useTemplateRef("formRef")
const tmodel = ref<ModelMeta>({
  id: "",
  type: [],
  modelName: "",
  providerName: "",
  subProviderName: "",
})
const rules = shallowReactive<Partial<Record<string, Arrayable<FormItemRule>>>>({
  modelName: [{ type: "string", whitespace: false, required: true, message: t("form.stringFieldNotNull") }],
  providerName: [{ type: "string", whitespace: false, required: true, message: t("form.stringFieldNotNull") }],
  subProviderName: [{ type: "string", whitespace: false, required: true, message: t("form.stringFieldNotNull") }],
  icon: [{ type: "string", whitespace: false, required: true, message: t("form.selectFieldNotNull") }],
  type: [
    {
      type: "string",
      whitespace: false,
      required: true,
      message: t("form.selectFieldNotNull"),
      validator: (_, value) => {
        return isArrayLength(value)
      },
    },
  ],
})
function init() {
  if (props.model) {
    tmodel.value = cloneDeep(props.model)
  }
}
async function onConfirm(done: CallBackFn) {
  try {
    if (!tmodel.value) {
      done()
      return
    }
    await formRef.value?.validate()
    emit("confirm", cloneDeep(tmodel.value), () => {
      done()
      emit("close")
    })
  } catch (_) {
    done()
  }
}
async function onCancel() {
  emit("close")
}
onMounted(init)
</script>
<template>
  <DialogPanel class="h-50vh w-full">
    <el-form ref="formRef" label-width="10rem" :model="tmodel" :rules>
      <el-form-item :label="t('provider.model.name')" prop="modelName">
        <el-input :disabled="!!model" :model-value="tmodel.modelName"> </el-input>
      </el-form-item>
      <el-form-item :label="t('provider.providerName')" prop="providerName">
        <el-input :disabled="!!model" v-model="tmodel.providerName"> </el-input>
      </el-form-item>
      <el-form-item :label="t('provider.model.subProvider')" prop="subProviderName">
        <el-input v-model="tmodel.subProviderName"> </el-input>
      </el-form-item>
      <el-form-item :label="t('provider.model.icon')" prop="icon">
        <SvgPicker v-model="tmodel.icon"></SvgPicker>
      </el-form-item>
      <el-form-item :label="t('provider.model.active')" prop="active">
        <el-switch v-model="tmodel.active" />
      </el-form-item>
      <el-form-item prop="type">
        <template #label>
          <el-space>
            <el-text>{{ t("provider.model.type") }}</el-text>
            <el-tooltip
              :teleported="false"
              popper-class="max-w-25rem"
              :content="t('provider.model.typeDesc')"
              placement="top">
              <i-material-symbols-help-outline></i-material-symbols-help-outline>
            </el-tooltip>
          </el-space>
        </template>
        <el-checkbox-group v-model="tmodel.type">
          <el-checkbox v-for="(item, index) in ModelType" :key="index" :label="item">
            {{ t(`modelType.${item}`) }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <Button type="primary" @click="onConfirm">{{ t("btn.confirm") }}</Button>
      <Button @click="onCancel">{{ t("btn.cancel") }}</Button>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
