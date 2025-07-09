<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
// import useSettingsStore from "@renderer/store/settings"
defineProps<{
  topic: ChatTopic
}>()
// const settingsStore = useSettingsStore()
const { t } = useI18n()
const defaultConfig = () => ({
  temperature: 1,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 4096,
})
const config = reactive(defaultConfig())
// settingsStore.api.dataWatcher<ReturnType<typeof defaultConfig>>(
//   SettingKeys.ChatTextToImageConfig,
//   config,
//   defaultConfig()
// )
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
      <div class="h-40rem w-full flex flex-col">
        <ContentBox>
          <div class="flex gap-.5rem">
            <el-text>{{ t("chat.llm.max_tokens") }}</el-text>
            <el-text type="primary">max_tokens</el-text>
          </div>
          <template #end>
            <el-tooltip :content="t('chat.llm.maxTokensExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider v-model="config.max_tokens" :min="1024" :max="102400" :step="1"></el-slider>
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
            <el-tooltip :content="t('chat.llm.temperatureExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider v-model="config.temperature" :min="0" :max="2" :step="0.1"></el-slider>
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
            <el-tooltip :content="t('chat.llm.topPExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider v-model="config.top_p" :min="0" :max="1" :step="0.1"></el-slider>
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
            <el-tooltip :content="t('chat.llm.frequencyPenaltyExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider v-model="config.frequency_penalty" :min="-2" :max="2" :step="0.1"></el-slider>
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
            <el-tooltip :content="t('chat.llm.presencePenaltyExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1rem w-full flex">
              <el-slider v-model="config.presence_penalty" :min="-2" :max="2" :step="0.1"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
      </div>
    </DialogPanel>
  </el-popover>
</template>
