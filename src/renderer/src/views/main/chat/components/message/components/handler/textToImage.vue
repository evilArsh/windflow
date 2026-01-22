<script lang="ts" setup>
import { ChatTTIConfig, ChatTopic, SettingKeys, TTIConfig } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import useSettings from "@renderer/store/settings"
import Chance from "chance"
import { storeToRefs } from "pinia"
import { useThrottleFn } from "@vueuse/core"
import { cloneDeep, errorToText } from "@toolmain/shared"
import { Spinner } from "@toolmain/components"
import Shell from "./components/shell.vue"
import { defaultTTIConfig } from "@windflow/core/storage"
import { msg } from "@renderer/utils"
import Group from "./components/group.vue"
const props = defineProps<{
  topic: ChatTopic
}>()
const chatStore = useChatStore()
const settingsStore = useSettings()
const { chatTTIConfig } = storeToRefs(chatStore)
const { t } = useI18n()
const chance = markRaw(new Chance())
const config = computed<ChatTTIConfig | undefined>(() => chatTTIConfig.value[props.topic.id])
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
        await chatStore.updateChatTTIConfig({
          id: config.value.id,
          topicId: props.topic.id,
          ...defaultTTIConfig(),
        })
      } else if (cmd === "restoreGlobal") {
        // use global config
        if (!config.value) return
        let globalVal = await settingsStore.get<TTIConfig>(SettingKeys.ChatTextToImageConfig)
        if (!globalVal) {
          globalVal = {
            id: SettingKeys.ChatTextToImageConfig,
            value: defaultTTIConfig(),
          }
          await settingsStore.add(globalVal)
        }
        await chatStore.updateChatTTIConfig({
          id: config.value.id,
          topicId: props.topic.id,
          ...globalVal.value,
        })
      } else if (cmd === "coverGlobal") {
        // cover global config
        if (!config.value) return
        const { id, topicId, ...copyData } = cloneDeep(config.value)
        await settingsStore.update({
          id: SettingKeys.ChatTextToImageConfig,
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
  return { dropList, loading, onCommand }
}
const { dropList, loading, onCommand } = useEvent()
const update = useThrottleFn(
  async () => {
    if (!config.value) return
    await chatStore.updateChatTTIConfig(config.value)
  },
  250,
  true
)
const sizeOptions = ref([
  { value: "1024x1024", label: "1:1 (1024×1024)" },
  { value: "1024x2048", label: "1:2 (1024×2048)" },
  { value: "1536x1024", label: "3:2 (1536×1024)" },
  { value: "768x1024", label: "3:4 (768×1024)" },
  { value: "1820x1024", label: "16:9 (1820×1024)" },
  { value: "1024x1820", label: "9:16 (1024×1820)" },
  { value: "1365x1024", label: "4:3 (1365×1024)" },
  { value: "1024x1365", label: "3:4 (1024×1365)" },
])
function onRandSeed() {
  if (!config.value) return
  config.value.seed = chance.integer({ min: 0, max: 99999999 })
  update()
}
</script>
<template>
  <Shell>
    <template #reference>
      <ContentBox background>
        <i-material-symbols-image-search-outline class="text-1.6rem"></i-material-symbols-image-search-outline>
      </ContentBox>
    </template>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-.5rem">
          <el-text>{{ t("chat.tti.label") }}</el-text>
          <Spinner class="text-1.2rem" v-model="loading"></Spinner>
        </div>
        <el-dropdown :teleported="false" @command="onCommand">
          <el-button plain text size="small" type="info">
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
      <div v-else class="tti-wrap h-40rem w-full flex flex-col">
        <Group>
          <ContentBox class="setting-box">
            <el-text>{{ t("chat.tti.imageSize") }}</el-text>
            <template #footer>
              <el-select
                size="small"
                v-model="config.size"
                @change="update"
                :teleported="false"
                append-to=".size-anchor">
                <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </ContentBox>
          <ContentBox class="setting-box">
            <el-text>{{ t("chat.tti.seed") }}</el-text>
            <template #footer>
              <el-input size="small" readonly v-model="config.seed">
                <template #append>
                  <i-ep-refresh @click="onRandSeed" class="text-1.2rem"></i-ep-refresh>
                </template>
              </el-input>
            </template>
          </ContentBox>
          <ContentBox class="setting-box">
            <el-text>{{ t("chat.tti.n") }}</el-text>
            <template #footer>
              <div class="px-1.5rem w-full flex">
                <el-slider size="small" show-input @change="update" v-model="config.n" :min="1" :max="4"></el-slider>
              </div>
            </template>
          </ContentBox>
          <ContentBox class="setting-box">
            <el-text>{{ t("chat.tti.inferenceSteps") }}</el-text>
            <template #end>
              <el-tooltip
                popper-class="max-w-25rem"
                :teleported="false"
                :content="t('chat.tti.inferenceStepsExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
            <template #footer>
              <div class="px-1.5rem w-full flex">
                <el-slider
                  size="small"
                  @change="update"
                  show-input
                  v-model="config.num_inference_steps"
                  :min="1"
                  :max="100"></el-slider>
              </div>
            </template>
          </ContentBox>
          <ContentBox class="setting-box">
            <el-text>{{ t("chat.tti.guidanceScale") }}</el-text>
            <template #end>
              <el-tooltip
                popper-class="max-w-25rem"
                :teleported="false"
                :content="t('chat.tti.guidanceScaleExp')"
                placement="top">
                <i-material-symbols-help-outline></i-material-symbols-help-outline>
              </el-tooltip>
            </template>
            <template #footer>
              <div class="px-1.5rem w-full flex">
                <el-slider
                  size="small"
                  @change="update"
                  show-input
                  v-model="config.guidance_scale"
                  :min="0"
                  :max="20"></el-slider>
              </div>
            </template>
          </ContentBox>
          <ContentBox class="setting-box">
            <el-text>{{ t("chat.tti.negativePrompt") }}</el-text>
            <template #footer>
              <el-input
                size="small"
                @change="update"
                type="textarea"
                v-model="config.negative_prompt"
                autosize></el-input>
            </template>
          </ContentBox>
        </Group>
      </div>
    </template>
  </Shell>
</template>
<style lang="scss" scoped>
@use "./components/common.scss";
.tti-wrap {
  :deep(.el-form-item__label) {
    line-height: unset;
  }
}
</style>
