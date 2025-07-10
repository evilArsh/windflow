<script lang="ts" setup>
import { ChatLLMConfig, ChatTopic } from "@renderer/types"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import { useThrottleFn } from "@vueuse/core"
const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const { chatLLMConfig } = storeToRefs(chatStore)
const config = computed<ChatLLMConfig | undefined>(() => chatLLMConfig.value[props.topic.id])
const update = useThrottleFn(
  async () => {
    if (!config.value) return
    await chatStore.api.updateChatLLMConfig(config.value)
  },
  250,
  true
)
</script>
<template>
  <el-popover placement="top" :width="500" trigger="hover" popper-style="--el-popover-padding: 0">
    <template #reference>
      <ContentBox background>
        <i-ic:baseline-list-alt class="text-1.6rem"></i-ic:baseline-list-alt>
      </ContentBox>
    </template>
    <DialogPanel>
      <template #header>
        <el-text>{{ t("chat.llm.label") }}</el-text>
      </template>
      <div v-if="!config" class="h-40rem w-full">
        <el-empty></el-empty>
      </div>
      <div v-else class="h-40rem w-full flex flex-col">
        <ContentBox>
          <div class="flex gap-.5rem">
            <el-text>{{ t("chat.llm.stream") }}</el-text>
            <el-text type="primary">stream</el-text>
          </div>
          <template #end>
            <el-tooltip
              :teleported="false"
              popper-class="max-w-25rem"
              :content="t('chat.llm.streamExp')"
              placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-switch @change="update" v-model="config.stream"></el-switch>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <div class="flex gap-.5rem">
            <el-text>{{ t("chat.llm.max_tokens") }}</el-text>
            <el-text type="primary">max_tokens</el-text>
          </div>
          <template #end>
            <el-tooltip
              :teleported="false"
              popper-class="max-w-25rem"
              :content="t('chat.llm.maxTokensExp')"
              placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider
                @change="update"
                show-input
                v-model="config.max_tokens"
                :min="1024"
                :max="102400"
                :step="1"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <div class="flex gap-.5rem">
            <el-text>{{ t("chat.llm.temperature") }}</el-text>
            <el-text type="primary">temperature</el-text>
          </div>
          <template #end>
            <el-tooltip
              :teleported="false"
              popper-class="max-w-25rem"
              :content="t('chat.llm.temperatureExp')"
              placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider
                @change="update"
                show-input
                v-model="config.temperature"
                :min="0"
                :max="2"
                :step="0.1"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <div class="flex gap-.5rem">
            <el-text>{{ t("chat.llm.topP") }}</el-text>
            <el-text type="primary">top_p</el-text>
          </div>
          <template #end>
            <el-tooltip :teleported="false" popper-class="max-w-25rem" :content="t('chat.llm.topPExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider show-input v-model="config.top_p" :min="0" :max="1" :step="0.1"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <div class="flex gap-.5rem">
            <el-text>{{ t("chat.llm.frequencyPenalty") }}</el-text>
            <el-text type="primary">frequency_penalty</el-text>
          </div>
          <template #end>
            <el-tooltip
              :teleported="false"
              popper-class="max-w-25rem"
              :content="t('chat.llm.frequencyPenaltyExp')"
              placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider
                @change="update"
                show-input
                v-model="config.frequency_penalty"
                :min="-2"
                :max="2"
                :step="0.1"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <div class="flex gap-.5rem">
            <el-text>{{ t("chat.llm.presence_penalty") }}</el-text>
            <el-text type="primary">presence_penalty</el-text>
          </div>
          <template #end>
            <el-tooltip
              :teleported="false"
              popper-class="max-w-25rem"
              :content="t('chat.llm.presencePenaltyExp')"
              placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider
                @change="update"
                show-input
                v-model="config.presence_penalty"
                :min="-2"
                :max="2"
                :step="0.1"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
      </div>
    </DialogPanel>
  </el-popover>
</template>
