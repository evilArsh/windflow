<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import type { FormInstance } from "element-plus"
import ModelSelect from "../model/index.vue"
import SvgPicker from "@renderer/components/SvgPicker/index.vue"
import { cloneDeep } from "lodash-es"
const { t } = useI18n()
const props = defineProps<{
  modelValue?: ChatTopic
}>()
const emit = defineEmits<{
  (e: "change", data: ChatTopic): void
  (e: "update:modelValue", value: ChatTopic): void
}>()

const form = ref<ChatTopic>({
  id: "",
  label: "新的聊天",
  icon: "",
  content: "",
  modelIds: [],
  children: [],
})

watch(
  () => props.modelValue,
  v => {
    if (v) form.value = cloneDeep(v)
  },
  { immediate: true }
)

const formRef = useTemplateRef<FormInstance>("formRef")

const pop = reactive({
  show: false,
  toggle: markRaw(() => {
    pop.show = !pop.show
    if (!pop.show) {
      formRef.value?.resetFields()
    }
  }),
})

const onConfirm = () => {
  if (props.modelValue) {
    emit("update:modelValue", cloneDeep(form.value))
  } else {
    form.value.id = uniqueId()
    emit("change", cloneDeep(form.value))
  }
  pop.toggle()
}
</script>
<template>
  <el-popover placement="right" :width="600" :visible="pop.show">
    <template #reference>
      <slot :pop>
        <el-button @click="pop.toggle">
          <template #icon>
            <i class="text-1.4rem i-ep:plus"></i>
          </template>
          <el-text>{{ t("chat.addChat") }}</el-text>
        </el-button>
      </slot>
    </template>
    <template #default>
      <el-form ref="formRef" :model="form">
        <el-form-item prop="label" label="标题">
          <el-input v-model="form.label" />
        </el-form-item>
        <el-form-item prop="icon" label="图标">
          <SvgPicker v-model="form.icon"></SvgPicker>
        </el-form-item>
        <el-form-item prop="content" label="描述">
          <el-input v-model="form.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item prop="modelIds" label="模型">
          <ModelSelect v-model="form.modelIds"></ModelSelect>
        </el-form-item>
      </el-form>
      <el-form-item>
        <div class="flex flex-1">
          <el-button size="small" type="primary" @click="onConfirm"> 确定 </el-button>
          <el-button size="small" @click="pop.toggle"> 取消 </el-button>
        </div>
      </el-form-item>
    </template>
  </el-popover>
</template>
