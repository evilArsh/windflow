<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
const props = defineProps<{
  modelValue: ChatTopic
}>()
const emit = defineEmits<{
  "update:modelValue": [ChatTopic]
}>()
const data = computed<ChatTopic>({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
</script>
<template>
  <div class="flex flex-col gap.5rem">
    <ContentBox>
      <template #icon>
        <i class="i-fluent-emoji-flat:flashlight"></i>
      </template>
      <el-text type="info">提示词</el-text>
    </ContentBox>
    <el-input
      type="textarea"
      v-model="data.prompt"
      resize="vertical"
      :autosize="{ minRows: 5, maxRows: 15 }"></el-input>
  </div>
</template>
<style lang="scss" scoped></style>
