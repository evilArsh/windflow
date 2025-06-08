<script setup lang="ts">
import { ChatMessageData, ChatTopic } from "@renderer/types/chat"
import useChatStore from "@renderer/store/chat"

import { CallBackFn } from "@renderer/lib/shared/types"
import { Role } from "@renderer/types"
import { code1xx } from "@shared/types/bridge"
const props = defineProps<{
  messageItem: ChatMessageData
  topic: ChatTopic
  parent?: ChatMessageData
  hideEdit?: boolean
}>()
defineEmits<{
  edit: []
  delete: []
}>()
const { t } = useI18n()
const chatStore = useChatStore()

const topic = computed(() => props.topic)
const messageItem = computed(() => props.messageItem)
const isAssistant = computed(() => props.messageItem.content.role === Role.Assistant)

const isProcessing = computed(() => {
  return isArray(messageItem.value.children) && messageItem.value.children.length > 0
    ? messageItem.value.children.some(child => {
        return code1xx(child.status) || child.status == 206
      })
    : code1xx(messageItem.value.status) || messageItem.value.status == 206
})

const isFinish = computed(() => {
  return isArray(messageItem.value.children) && messageItem.value.children.length > 0
    ? messageItem.value.children.every(child => child.finish)
    : messageItem.value.finish
})
function terminate(done: CallBackFn) {
  chatStore.terminate(topic.value, messageItem.value.id, props.parent?.id)
  done()
}
function restart() {
  chatStore.restart(topic.value, messageItem.value.id, props.parent?.id)
}
</script>
<template>
  <div class="flex gap1rem py1rem">
    <div class="flex items-center">
      <el-tooltip v-if="isAssistant" :content="t('chat.terminate')" placement="bottom">
        <Button
          @click="done => terminate(done)"
          size="small"
          :disabled="!isProcessing"
          circle
          plain
          text
          type="primary">
          <i-solar:stop-circle-bold class="text-1.4rem"></i-solar:stop-circle-bold>
        </Button>
      </el-tooltip>
      <el-tooltip v-if="isAssistant" :content="t('chat.regenerate')" placement="bottom">
        <el-button @click="restart" size="small" :disabled="!isFinish" circle plain text type="primary">
          <i-solar:refresh-bold class="text-1.4rem"></i-solar:refresh-bold>
        </el-button>
      </el-tooltip>
      <el-tooltip v-if="!hideEdit" :content="t('chat.editChat')" placement="bottom">
        <el-button size="small" :disabled="!isFinish" circle plain text type="primary" @click="$emit('edit')">
          <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
        </el-button>
      </el-tooltip>
      <el-popconfirm :title="t('tip.deleteConfirm')" @confirm="$emit('delete')">
        <template #reference>
          <el-button size="small" :disabled="!isFinish" circle plain text type="danger">
            <i-solar:trash-bin-trash-outline class="text-1.4rem"></i-solar:trash-bin-trash-outline>
          </el-button>
        </template>
        <template #actions="{ confirm, cancel }">
          <div class="flex justify-between">
            <el-button type="danger" size="small" @click="confirm">{{ t("tip.yes") }}</el-button>
            <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
          </div>
        </template>
      </el-popconfirm>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
