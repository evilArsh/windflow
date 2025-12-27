<script lang="ts" setup>
import { ChatTopic } from "@windflow/core/types"
import ModelSelect from "../message/components/handler/modelSelect.vue"
import SvgPicker from "@renderer/components/SvgPicker/index.vue"
import { errorToText, msg } from "@toolmain/shared"
import useChatStore from "@renderer/store/chat"
import { useThrottleFn } from "@vueuse/core"
const props = defineProps<{
  topic: ChatTopic
}>()
const form = computed(() => props.topic)
const { t } = useI18n()
const cardRef = useTemplateRef<HTMLElement>("card")
const chatStore = useChatStore()
const onTopicUpdate = useThrottleFn(async () => {
  try {
    await chatStore.updateChatTopic(form.value)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
})
const onIconChange = async (icon: string) => {
  form.value.icon = icon
  onTopicUpdate()
}
defineExpose({
  bounding: () => {
    return cardRef.value?.getBoundingClientRect()
  },
})
</script>
<template>
  <div ref="card" class="w-100% h-100%">
    <el-card style="--el-card-padding: 1rem">
      <template #header>
        <el-text type="primary">{{ t("topic.edit") }}</el-text>
      </template>
      <el-form ref="formRef" :model="form" class="w-100% h-100%" label-width="7rem" @submit.prevent>
        <el-form-item prop="label" :label="t('topic.title')">
          <el-input v-model="form.label" @input="onTopicUpdate" />
        </el-form-item>
        <el-form-item prop="prompt" :label="t('topic.prompt')">
          <el-input
            @input="onTopicUpdate"
            v-model="form.prompt"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 10 }" />
        </el-form-item>
        <el-form-item prop="modelIds" :label="t('topic.model')">
          <ModelSelect :topic="form" @change="onTopicUpdate"></ModelSelect>
        </el-form-item>
        <el-form-item prop="icon" :label="t('topic.icon')">
          <SvgPicker :model-value="form.icon" @update:model-value="onIconChange"></SvgPicker>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
