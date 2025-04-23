<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import useChatStore from "@renderer/store/chat.store"
import useProviderStore from "@renderer/store/provider.store"
import useModelsStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import RawTextEdit from "../rawTextEdit/index.vue"
defineProps<{
  data: ChatMessageData
}>()
const { t } = useI18n()
const id = useId()
const rawDlg = useTemplateRef("rawDlg")
const chatStore = useChatStore()
const providerStore = useProviderStore()
const modelsStore = useModelsStore()
const { currentTopic, currentMessage } = storeToRefs(useChatStore())
const rawTextDlg = reactive({
  data: undefined as ChatMessageData | undefined,
  onChange: markRaw((value: string) => {
    if (rawTextDlg.data) {
      rawTextDlg.data.content.content = value
    }
  }),
  edit: markRaw((msg: ChatMessageData) => {
    rawTextDlg.data = msg
    rawDlg.value?.open()
  }),
})
</script>
<template>
  <MsgBubble :reverse="!data.modelId" :id>
    <template #head>
      <el-affix :offset="40" :target="`#${id}`">
        <div class="flex flex-col gap1rem">
          <ContentBox>
            <el-avatar style="--el-avatar-size: 4rem">
              <Svg
                :src="
                  providerStore.getProviderLogo(data.modelId ? modelsStore.find(data.modelId)?.providerName : 'user')
                "
                class="text-3rem"></Svg>
            </el-avatar>
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
            <el-tooltip v-if="data.modelId" :content="t('chat.editChat')" placement="right">
              <el-button
                size="small"
                :disabled="!data.finish"
                circle
                plain
                text
                type="primary"
                @click="rawTextDlg.edit(data)">
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
                  <el-button size="small" @click="cancel">{{ t("tip.cancel") }}</el-button>
                </div>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-affix>
    </template>
    <template #content>
      <div class="chat-item-container">
        <el-affix :offset="40" :target="`#${id}`">
          <div class="chat-item-header" :class="{ reverse: !data.modelId }">
            <div v-if="data.modelId" class="flex items-center gap-0.25rem">
              <el-text class="name">
                {{ modelsStore.find(data.modelId)?.providerName }}
              </el-text>
              <el-text type="danger">|</el-text>
              <el-text type="primary">{{ modelsStore.find(data.modelId)?.modelName }}</el-text>
            </div>
            <el-text class="time">{{ data.time }}</el-text>
          </div>
        </el-affix>
        <div class="chat-item-content" :class="{ reverse: !data.modelId }">
          <el-card style="--el-card-padding: 1rem" shadow="never">
            <template #header v-if="data.modelId">
              <div class="flex flex-col gap-0.5rem">
                <div>
                  <el-button v-show="data.status == 100 && data.reasoning" type="primary" loading size="small">
                    {{ t("chat.thinking") }}
                  </el-button>
                </div>
                <div>
                  <el-text v-show="data.content.reasoning_content" type="success" class="self-start!">
                    {{ data.content.reasoning_content }}
                  </el-text>
                </div>
                <div>
                  <el-text v-show="data.status == 100" type="primary" size="small">
                    <i-eos-icons:three-dots-loading class="text-4rem"></i-eos-icons:three-dots-loading>
                  </el-text>
                </div>
              </div>
            </template>
            <Markdown v-if="data.modelId" :id="data.id" :content="data.content.content" :partial="!data.finish" />
            <el-text v-else type="primary" class="self-end!">
              {{ data.content.content }}
            </el-text>
            <template #footer> </template>
          </el-card>
        </div>
        <div class="chat-item-footer"></div>
      </div>
    </template>
  </MsgBubble>
  <RawTextEdit ref="rawDlg" @change="rawTextDlg.onChange" :data="rawTextDlg.data?.content.content"></RawTextEdit>
</template>
<style lang="scss" scoped>
.chat-item-container {
  --chat-item-header-bg-color: #fff;
  --chat-item-content-bg-color: transparent;
  --chat-item-container-bg-color: transparent;
  --chat-item-footer-bg-color: transparent;

  background-color: var(--chat-item-container-bg-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .chat-item-header {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--chat-item-header-bg-color);
    gap: 0.5rem;
    .name {
      align-self: unset;
      font-size: 1.4rem;
      font-weight: 600;
    }
    .time {
      align-self: unset;
      font-size: 1.2rem;
    }
    &.reverse {
      align-items: flex-end;
    }
  }
  .chat-item-content {
    flex: 1;
    display: flex;
    background-color: var(--chat-item-content-bg-color);
    font-size: 1.4rem;
    flex-direction: column;
    gap: 1rem;
    &.reverse {
      justify-content: flex-end;
    }
  }
  .chat-item-footer {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-item-footer-bg-color);
  }
}
</style>
