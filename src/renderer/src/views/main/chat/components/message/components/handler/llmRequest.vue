<script lang="ts" setup>
import { ChatLLMConfig, ChatTopic, LLMConfig, SettingKeys } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import useSettings from "@renderer/store/settings"
import { storeToRefs } from "pinia"
import { useThrottleFn } from "@vueuse/core"
import { cloneDeep, errorToText } from "@toolmain/shared"
import { Spinner } from "@toolmain/components"
import Shell from "./components/shell.vue"
import { defaultLLMConfig } from "@windflow/core/storage"
import { msg } from "@renderer/utils"
import Group from "./components/group.vue"
import Item from "./components/item.vue"
const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const settingsStore = useSettings()
const { chatLLMConfig } = storeToRefs(chatStore)
const config = computed<ChatLLMConfig | undefined>(() => chatLLMConfig.value[props.topic.id])
const useEvent = () => {
  const loading = ref(false)
  const dropList = shallowRef([
    { label: "chat.llm.btnReset", value: "reset" },
    { label: "chat.llm.btnRestoreGlobal", value: "restoreGlobal" },
    { label: "chat.llm.btnCoverGlobal", value: "coverGlobal" },
  ])
  async function onCommand(cmd: string) {
    try {
      loading.value = true
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
        const { id, topicId, ...copyData } = cloneDeep(config.value)
        await settingsStore.update({
          id: SettingKeys.ChatLLMConfig,
          value: copyData,
        })
      }
      msg({ code: 200, msg: "ok" })
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    } finally {
      loading.value = false
    }
  }
  const update = useThrottleFn(
    async () => {
      if (!config.value) return
      loading.value = true
      await chatStore.updateChatLLMConfig(config.value)
      loading.value = false
    },
    250,
    true
  )
  return { loading, dropList, onCommand, update }
}
const { loading, dropList, onCommand, update } = useEvent()
</script>
<template>
  <Shell>
    <template #reference>
      <ContentBox background>
        <i-material-symbols-assignment-globe-outline class="text-1.6rem"></i-material-symbols-assignment-globe-outline>
      </ContentBox>
    </template>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-.5rem">
          <el-text type="primary">{{ t("chat.llm.label") }}</el-text>
          <Spinner class="text-1.2rem" v-model="loading"></Spinner>
        </div>
        <el-dropdown :teleported="false" @command="onCommand">
          <el-button plain text type="info">
            {{ t("chat.llm.btnMore") }}
            <i-ep-arrow-down class="ml-.5rem text-1.2rem"></i-ep-arrow-down>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in dropList" :key="item.value" :command="item.value">
                {{ t(item.label) }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>
    <template #default>
      <div v-if="!config" class="h-40rem w-full">
        <el-empty></el-empty>
      </div>
      <div v-else class="h-40rem w-full">
        <Group>
          <Item :title="t('chat.llm.stream')" icon-class="i-ic-baseline-flood">
            <el-switch @change="update" v-model="config.stream"></el-switch>
            <template #end>
              <el-tooltip
                :teleported="false"
                popper-class="max-w-25rem"
                :content="t('chat.llm.streamExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
          </Item>
          <Item :title="t('chat.llm.max_tokens')" icon-class="i-ic-baseline-format-color-text">
            <el-slider
              @change="update"
              show-input
              v-model="config.max_tokens"
              :min="1024"
              :max="102400"
              :step="1"></el-slider>
            <template #end>
              <el-tooltip
                :teleported="false"
                popper-class="max-w-25rem"
                :content="t('chat.llm.maxTokensExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
          </Item>
          <Item :title="t('chat.llm.temperature')" icon-class="i-ic-twotone-whatshot">
            <el-slider
              @change="update"
              show-input
              v-model="config.temperature"
              :min="0"
              :max="2"
              :step="0.1"></el-slider>
            <template #end>
              <el-tooltip
                :teleported="false"
                popper-class="max-w-25rem"
                :content="t('chat.llm.temperatureExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
          </Item>
          <Item :title="t('chat.llm.topP')" icon-class="i-ic-baseline-my-location">
            <el-slider show-input v-model="config.top_p" :min="0" :max="1" :step="0.1"></el-slider>
            <template #end>
              <el-tooltip
                :teleported="false"
                popper-class="max-w-25rem"
                :content="t('chat.llm.topPExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
          </Item>
          <Item :title="t('chat.llm.frequencyPenalty')" icon-class="i-ic-sharp-wb-incandescent">
            <el-slider
              @change="update"
              show-input
              v-model="config.frequency_penalty"
              :min="-2"
              :max="2"
              :step="0.1"></el-slider>
            <template #end>
              <el-tooltip
                :teleported="false"
                popper-class="max-w-25rem"
                :content="t('chat.llm.frequencyPenaltyExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
          </Item>
          <Item :title="t('chat.llm.presence_penalty')" icon-class="i-ic-baseline-troubleshoot">
            <el-slider
              @change="update"
              show-input
              v-model="config.presence_penalty"
              :min="-2"
              :max="2"
              :step="0.1"></el-slider>
            <template #end>
              <el-tooltip
                :teleported="false"
                popper-class="max-w-25rem"
                :content="t('chat.llm.presencePenaltyExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
          </Item>
        </Group>
      </div>
    </template>
  </Shell>
</template>
