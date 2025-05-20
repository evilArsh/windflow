<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import useChatStore from "@renderer/store/chat.store"

import { storeToRefs } from "pinia"
import { errorToText } from "@shared/error"
const props = defineProps<{
  data: ChatMessageData
}>()
defineEmits<{
  edit: []
}>()
const { t } = useI18n()
const chatStore = useChatStore()

const { currentTopic, currentMessage } = storeToRefs(useChatStore())
async function deleteMessage() {
  try {
    if (currentMessage.value) {
      chatStore.deleteSubMessage(currentTopic.value?.node, currentMessage.value, props.data.id)
      chatStore.api.updateChatMessage(currentMessage.value)
    }
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
</script>
<template>
  <div class="flex gap1rem py1rem">
    <div class="flex gap0.5rem items-center">
      <el-tooltip v-if="data.modelId" :content="t('chat.terminate')" placement="bottom">
        <Button
          @click="done => chatStore.terminate(done, currentTopic?.node.id, data.id)"
          size="small"
          :disabled="!(data.status == 206 || data.status == 100)"
          circle
          plain
          text
          type="primary">
          <i-solar:stop-circle-bold class="text-1.4rem"></i-solar:stop-circle-bold>
        </Button>
      </el-tooltip>
      <el-tooltip v-if="data.modelId" :content="t('chat.regenerate')" placement="bottom">
        <el-button
          @click="chatStore.restart(currentTopic?.node, data.id)"
          size="small"
          :disabled="!data.finish"
          circle
          plain
          text
          type="primary">
          <i-solar:refresh-bold class="text-1.4rem"></i-solar:refresh-bold>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('chat.editChat')" placement="bottom">
        <el-button size="small" :disabled="!data.finish" circle plain text type="primary" @click="$emit('edit')">
          <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
        </el-button>
      </el-tooltip>
      <el-popconfirm :title="t('tip.deleteConfirm')" @confirm="deleteMessage">
        <template #reference>
          <el-button size="small" :disabled="!data.finish" circle plain text type="danger">
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
