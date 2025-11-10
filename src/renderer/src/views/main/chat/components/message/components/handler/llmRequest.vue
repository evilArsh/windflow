<script lang="ts" setup>
import { ChatLLMConfig, ChatTopic, LLMConfig, SettingKeys } from "@renderer/types"
import useChatStore from "@renderer/store/chat"
import useSettings from "@renderer/store/settings"
import { storeToRefs } from "pinia"
import { useThrottleFn } from "@vueuse/core"
import { defaultLLMConfig } from "@renderer/store/chat/default"
import { cloneDeep, errorToText, msg } from "@toolmain/shared"
import { DialogPanel, Spinner } from "@toolmain/components"
const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const settingsStore = useSettings()
const { chatLLMConfig } = storeToRefs(chatStore)
const config = computed<ChatLLMConfig | undefined>(() => chatLLMConfig.value[props.topic.id])
const event = shallowReactive({
  loading: false,
  dropList: [
    { label: "chat.llm.btnReset", value: "reset" },
    { label: "chat.llm.btnRestoreGlobal", value: "restoreGlobal" },
    { label: "chat.llm.btnCoverGlobal", value: "coverGlobal" },
  ],
  async onCommand(cmd: string) {
    try {
      event.loading = true
      if (cmd === "reset") {
        if (!config.value) return
        await chatStore.updateChatLLMConfig({
          id: config.value.id,
          topicId: props.topic.id,
          ...defaultLLMConfig(),
        })
      } else if (cmd === "restoreGlobal") {
        // use global config
        if (!config.value) return
        let globalVal = await settingsStore.get<LLMConfig>(SettingKeys.ChatLLMConfig)
        if (!globalVal) {
          globalVal = {
            id: SettingKeys.ChatLLMConfig,
            value: defaultLLMConfig(),
          }
          await settingsStore.add(globalVal)
        }
        await chatStore.updateChatLLMConfig({
          id: config.value.id,
          topicId: props.topic.id,
          ...globalVal.value,
        })
      } else if (cmd === "coverGlobal") {
        // cover global config
        if (!config.value) return
        const copyData = cloneDeep(config.value) as LLMConfig
        delete copyData["id"]
        delete copyData["topicId"]
        await settingsStore.update({
          id: SettingKeys.ChatLLMConfig,
          value: copyData,
        })
      }
      msg({ code: 200, msg: "ok" })
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      event.loading = false
    }
  },
})
const update = useThrottleFn(
  async () => {
    if (!config.value) return
    event.loading = true
    await chatStore.updateChatLLMConfig(config.value)
    event.loading = false
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
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-.5rem">
            <el-text>{{ t("chat.llm.label") }}</el-text>
            <Spinner class="text-1.2rem" v-model="event.loading"></Spinner>
          </div>
          <el-dropdown :teleported="false" @command="event.onCommand">
            <el-button plain text size="small" type="info">
              {{ t("chat.llm.btnMore") }}
              <i-ep:arrow-down class="ml-.5rem text-1.2rem"></i-ep:arrow-down>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in event.dropList" :key="item.value" :command="item.value">
                  {{ t(item.label) }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
      <div v-if="!config" class="h-40rem w-full">
        <el-empty></el-empty>
      </div>
      <div v-else class="h-40rem w-full flex flex-col">
        <el-divider class="my-.25rem!"></el-divider>
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
              <el-switch size="small" @change="update" v-model="config.stream"></el-switch>
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
                size="small"
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
                size="small"
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
              <el-slider size="small" show-input v-model="config.top_p" :min="0" :max="1" :step="0.1"></el-slider>
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
                size="small"
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
                size="small"
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
