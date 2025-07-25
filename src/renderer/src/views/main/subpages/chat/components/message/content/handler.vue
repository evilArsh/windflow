<script setup lang="ts">
import { ChatMessage, ChatTopic } from "@renderer/types/chat"
import useChatStore from "@renderer/store/chat"

import { CallBackFn } from "@renderer/lib/shared/types"
import { Role } from "@renderer/types"
import { code1xx } from "@shared/types/bridge"
import { errorToText } from "@shared/error"
const props = defineProps<{
  message: ChatMessage
  topic: ChatTopic
  parent?: ChatMessage
  hideEdit?: boolean
}>()
defineEmits<{
  edit: []
  delete: []
}>()
const { t } = useI18n()
const chatStore = useChatStore()

const topic = computed(() => props.topic)
const message = computed(() => props.message)
const isUser = computed(() => props.message.content.role === Role.User)

const isProcessing = computed(() => {
  return isArray(message.value.children) && message.value.children.length > 0
    ? message.value.children.some(child => {
        return code1xx(child.status) || child.status == 206
      })
    : code1xx(message.value.status) || message.value.status == 206
})

const isFinish = computed(() => {
  return isArray(message.value.children) && message.value.children.length > 0
    ? message.value.children.every(child => child.finish)
    : message.value.finish
})
function terminate(done: CallBackFn) {
  chatStore.terminate(topic.value, message.value.id, props.parent?.id)
  done()
}
async function restart(done: CallBackFn) {
  try {
    await chatStore.restart(topic.value, message.value.id, props.parent?.id)
    done()
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
    done()
  }
}
</script>
<template>
  <div class="flex items-center flex-wrap">
    <el-tooltip v-if="!isUser" :content="t('chat.terminate')" placement="bottom">
      <ContentBox class="m0!" background>
        <Button
          text
          @click="done => terminate(done)"
          size="small"
          :disabled="!isProcessing"
          circle
          plain
          type="primary">
          <i-solar:stop-circle-bold class="text-1.4rem"></i-solar:stop-circle-bold>
        </Button>
      </ContentBox>
    </el-tooltip>
    <el-tooltip v-if="!isUser" :content="t('chat.regenerate')" placement="bottom">
      <ContentBox class="m0!" background>
        <Button @click="restart" size="small" :disabled="!isFinish" circle plain text type="primary">
          <i-solar:refresh-bold class="text-1.4rem"></i-solar:refresh-bold>
        </Button>
      </ContentBox>
    </el-tooltip>
    <el-tooltip v-if="!hideEdit" :content="t('chat.editChat')" placement="bottom">
      <ContentBox class="m0!" background>
        <el-button size="small" :disabled="!isFinish" circle plain text type="primary" @click="$emit('edit')">
          <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
        </el-button>
      </ContentBox>
    </el-tooltip>
    <el-popconfirm :title="t('tip.deleteConfirm')" @confirm="$emit('delete')">
      <template #reference>
        <ContentBox class="m0!" background>
          <el-button size="small" :disabled="!isFinish" circle plain text type="danger">
            <i-solar:trash-bin-trash-outline class="text-1.4rem"></i-solar:trash-bin-trash-outline>
          </el-button>
        </ContentBox>
      </template>
      <template #actions="{ confirm, cancel }">
        <div class="flex justify-between">
          <el-button type="danger" size="small" @click="confirm">{{ t("tip.yes") }}</el-button>
          <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
        </div>
      </template>
    </el-popconfirm>
  </div>
</template>
<style lang="scss" scoped></style>
