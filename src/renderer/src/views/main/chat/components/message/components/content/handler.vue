<script setup lang="ts">
import { ChatMessageTree, ChatTopic } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import { msg } from "@renderer/utils"

import { errorToText, CallBackFn, code1xx, isArrayLength } from "@toolmain/shared"
import { Role } from "@windflow/core/types"
const props = defineProps<{
  message: ChatMessageTree
  topic: ChatTopic
}>()
const emit = defineEmits<{
  delete: [done: CallBackFn]
  edit: [done?: CallBackFn]
}>()
const { t } = useI18n()
const chatStore = useChatStore()

const message = computed(() => props.message)
const isUser = computed(() => props.message.node.content.role === Role.User)

const isProcessing = computed(() => {
  return isArrayLength(message.value.children)
    ? message.value.children.some(child => {
        return code1xx(child.node.status) || child.node.status == 206
      })
    : code1xx(message.value.node.status) || message.value.node.status == 206
})

const isFinish = computed(() => {
  return isArrayLength(message.value.children)
    ? message.value.children.every(child => child.node.finish)
    : message.value.node.finish
})
async function terminate(done?: CallBackFn) {
  await chatStore.terminate(message.value.id)
  done?.()
}
async function restart(done?: CallBackFn) {
  try {
    await chatStore.restart(message.value.id)
    done?.()
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
    done?.()
  }
}
</script>
<template>
  <div class="handler">
    <ContentBox
      :text-loading="false"
      class="primary"
      v-if="!isUser"
      @click="(_, done) => terminate(done)"
      button
      :disabled="!isProcessing">
      <i-solar-stop-circle-bold class="text-1.4rem"></i-solar-stop-circle-bold>
    </ContentBox>
    <ContentBox :text-loading="false" class="primary" @click="(_, done) => restart(done)" :disabled="!isFinish">
      <i-solar-refresh-bold class="text-1.4rem"></i-solar-refresh-bold>
    </ContentBox>
    <ContentBox :text-loading="false" class="primary" :disabled="!isFinish" @click="(_, done) => emit('edit', done)">
      <i-solar-clapperboard-edit-broken class="text-1.4rem"></i-solar-clapperboard-edit-broken>
    </ContentBox>
    <PopConfirm
      :title="t('tip.deleteConfirm')"
      :confirm-button-text="t('tip.yes')"
      confirm-button-type="danger"
      :cancel-button-text="t('btn.cancel')"
      :disabled="!isFinish"
      size="small"
      :confirm="done => $emit('delete', done)">
      <template #reference="{ loading, disabled }">
        <ContentBox :text-loading="false" class="danger" :loading :disabled="!isFinish || disabled">
          <i-solar-trash-bin-trash-outline class="text-1.4rem"></i-solar-trash-bin-trash-outline>
        </ContentBox>
      </template>
    </PopConfirm>
  </div>
</template>
<style lang="scss" scoped>
.primary {
  --box-text-color: var(--el-color-primary);
  --box-text-active-color: var(--el-color-primary);
  --box-text-hover-color: var(--el-color-primary);
  --box-padding: var(--ai-gap-base);
}
.danger {
  --box-text-color: var(--el-color-danger);
  --box-text-active-color: var(--el-color-danger);
  --box-text-hover-color: var(--el-color-danger);
  --box-padding: var(--ai-gap-base);
}
.handler {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ai-gap-base);
}
</style>
