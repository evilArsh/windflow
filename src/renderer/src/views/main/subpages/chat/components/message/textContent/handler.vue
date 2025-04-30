<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import useChatStore from "@renderer/store/chat.store"
import useProviderStore from "@renderer/store/provider.store"
import useModelsStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
defineProps<{
  data: ChatMessageData
}>()
defineEmits<{
  edit: []
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const providerStore = useProviderStore()
const modelsStore = useModelsStore()
const { currentTopic, currentMessage } = storeToRefs(useChatStore())
</script>
<template>
  <div class="flex flex-col gap1rem py1rem">
    <ContentBox default-lock background>
      <Svg
        :src="providerStore.getProviderLogo(data.modelId ? modelsStore.find(data.modelId)?.providerName : 'user')"
        class="text-3rem"></Svg>
    </ContentBox>
    <div class="flex flex-col gap0.5rem items-center">
      <el-tooltip v-if="data.modelId" :content="t('chat.terminate')" placement="right">
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
      <el-tooltip v-if="data.modelId" :content="t('chat.regenerate')" placement="right">
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
      <el-tooltip :content="t('chat.editChat')" placement="right">
        <el-button size="small" :disabled="!data.finish" circle plain text type="primary" @click="$emit('edit')">
          <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
        </el-button>
      </el-tooltip>
      <el-popconfirm
        :title="t('tip.deleteConfirm')"
        @confirm="chatStore.deleteSubMessage(currentTopic?.node, currentMessage, data.id)">
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
