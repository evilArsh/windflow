<script lang="ts" setup>
import useChatStore from "@renderer/store/chat.store"
import { ChatTopic } from "@renderer/types"
import type { FormInstance } from "element-plus"
import ModelSelect from "../model/index.vue"
import { cloneDeep } from "lodash-es"
import { HttpStatusCode } from "axios"
import SvgPicker from "@renderer/components/SvgPicker/index.vue"
// import ds from "@renderer/assets/images/provider/deepseek.svg"
const { t } = useI18n()
const charStore = useChatStore()
const emit = defineEmits<{
  (e: "create", id: string): void
}>()

const form = reactive<ChatTopic>({
  id: "",
  label: "新的聊天",
  icon: "",
  content: "",
  modelIds: [],
  children: [],
  chatMessages: [
    {
      content: {
        role: "system",
        content: "you are a helpful assistant",
      },
      id: uniqueId(),
      status: HttpStatusCode.Ok,
      modelId: "",
      time: formatSecond(new Date()),
    },
  ],
})
const formRef = useTemplateRef<FormInstance>("formRef")

const pop = reactive({
  show: false,
  toggle: markRaw(() => {
    pop.show = !pop.show
    if (pop.show) {
      form.id = uniqueId()
    } else {
      formRef.value?.resetFields()
    }
  }),
})

const onAddNewChat = () => {
  charStore.add(cloneDeep(toRaw(form)))
  emit("create", form.id)
  pop.toggle()
}
</script>
<template>
  <el-popover placement="right" :width="600" :visible="pop.show">
    <template #reference>
      <el-button @click="pop.toggle">
        <template #icon>
          <i class="text-1.4rem i-ep:plus"></i>
        </template>
        <el-text>{{ t("chat.addChat") }}</el-text>
      </el-button>
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
          <el-button size="small" type="primary" @click="onAddNewChat"> 创建 </el-button>
          <el-button size="small" @click="pop.toggle"> 取消 </el-button>
        </div>
      </el-form-item>
    </template>
  </el-popover>
</template>
