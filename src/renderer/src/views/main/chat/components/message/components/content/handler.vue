<script setup lang="ts">
import { ChatMessageTree, ChatTopic } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"

import { errorToText, CallBackFn, code1xx, msg, isArrayLength } from "@toolmain/shared"
import { Role } from "@windflow/core/types"
const props = defineProps<{
  message: ChatMessageTree
  topic: ChatTopic
  parent?: ChatMessageTree
}>()
defineEmits<{
  delete: [done: CallBackFn]
  edit: [done: CallBackFn]
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
function terminate(done: CallBackFn) {
  chatStore.terminate(message.value.id)
  done()
}
async function restart(done: CallBackFn) {
  try {
    await chatStore.restart(message.value.id)
    done()
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
    done()
  }
}
</script>
<template>
  <div class="flex items-center flex-wrap">
    <ContentBox class="m0!" background>
      <Button v-if="!isUser" @click="terminate" :disabled="!isProcessing" text size="small" circle plain type="primary">
        <i-solar-stop-circle-bold class="text-1.4rem"></i-solar-stop-circle-bold>
      </Button>
    </ContentBox>
    <ContentBox class="m0!" background>
      <Button size="small" @click="restart" :disabled="!isFinish" circle plain text type="primary">
        <i-solar-refresh-bold class="text-1.4rem"></i-solar-refresh-bold>
      </Button>
    </ContentBox>
    <ContentBox class="m0!" background>
      <Button size="small" :disabled="!isFinish" circle plain text type="primary" @click="done => $emit('edit', done)">
        <i-solar-clapperboard-edit-broken class="text-1.4rem"></i-solar-clapperboard-edit-broken>
      </Button>
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
        <ContentBox class="m0!" background>
          <el-button size="small" :loading :disabled="!isFinish || disabled" circle plain text type="danger">
            <i-solar-trash-bin-trash-outline class="text-1.4rem"></i-solar-trash-bin-trash-outline>
          </el-button>
        </ContentBox>
      </template>
    </PopConfirm>
  </div>
</template>
<style lang="scss" scoped></style>
