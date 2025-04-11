<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import ModelSelect from "../modelSelect/index.vue"
import SvgPicker from "@renderer/components/SvgPicker/index.vue"
const props = defineProps<{
  modelValue: ChatTopic
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: ChatTopic): void
  (e: "close"): void
}>()
const { t } = useI18n()
const form = computed<ChatTopic>({
  get: () => props.modelValue,
  set: (v: ChatTopic) => {
    emit("update:modelValue", v)
  },
})
const cardRef = useTemplateRef<HTMLElement>("card")
defineExpose({
  bounding: () => {
    return cardRef.value?.getBoundingClientRect()
  },
})
</script>
<template>
  <div ref="card" class="w-100% h-100%">
    <el-card style="--el-card-padding: 1rem">
      <el-form ref="formRef" :model="form" class="w-100% h-100%" label-width="7rem">
        <el-form-item prop="label" :label="t('topic.title')">
          <el-input v-model="form.label" />
        </el-form-item>
        <el-form-item prop="prompt" :label="t('topic.prompt')">
          <el-input v-model="form.prompt" type="textarea" :autosize="{ minRows: 4, maxRows: 10 }" />
        </el-form-item>
        <el-form-item prop="modelIds" :label="t('topic.model')">
          <ModelSelect v-model="form"></ModelSelect>
        </el-form-item>
        <el-form-item prop="icon" :label="t('topic.icon')">
          <SvgPicker v-model="form.icon"></SvgPicker>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
