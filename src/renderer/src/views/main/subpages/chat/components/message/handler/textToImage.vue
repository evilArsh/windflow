<script lang="ts" setup>
import { ChatTTIConfig, ChatTopic } from "@renderer/types"
import useChatStore from "@renderer/store/chat"
import Chance from "chance"
import { storeToRefs } from "pinia"
import { useThrottleFn } from "@vueuse/core"
const props = defineProps<{
  topic: ChatTopic
}>()
const chatStore = useChatStore()
const { chatTTIConfig } = storeToRefs(chatStore)
const { t } = useI18n()
const chance = markRaw(new Chance())
const config = computed<ChatTTIConfig | undefined>(() => chatTTIConfig.value[props.topic.id])
const update = useThrottleFn(
  async () => {
    if (!config.value) return
    await chatStore.api.updateChatTTIConfig(config.value)
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
  <el-popover placement="top" :width="500" trigger="hover" popper-style="--el-popover-padding: 0">
    <template #reference>
      <ContentBox background>
        <i-fluent-emoji-flat:framed-picture class="text-1.6rem"></i-fluent-emoji-flat:framed-picture>
      </ContentBox>
    </template>
    <DialogPanel>
      <template #header>
        <el-text>{{ t("chat.tti.label") }}</el-text>
      </template>
      <div v-if="!config" class="h-40rem w-full">
        <el-empty></el-empty>
      </div>
      <div v-else class="tti-wrap h-40rem w-full flex flex-col">
        <ContentBox>
          <el-text>{{ t("chat.tti.imageSize") }}</el-text>
          <template #footer>
            <el-select v-model="config.size" @change="update" :teleported="false" append-to=".size-anchor">
              <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.seed") }}</el-text>
          <template #footer>
            <el-input readonly v-model="config.seed">
              <template #append>
                <i-ep:refresh @click="onRandSeed" class="text-1.2rem"></i-ep:refresh>
              </template>
            </el-input>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.n") }}</el-text>
          <template #footer>
            <div class="px-1.5rem w-full flex">
              <el-slider show-input @change="update" v-model="config.n" :min="1" :max="4"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.inferenceSteps") }}</el-text>
          <template #end>
            <el-tooltip
              popper-class="max-w-25rem"
              :teleported="false"
              :content="t('chat.tti.inferenceStepsExp')"
              placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1.5rem w-full flex">
              <el-slider
                @change="update"
                show-input
                v-model="config.num_inference_steps"
                :min="1"
                :max="100"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.guidanceScale") }}</el-text>
          <template #end>
            <el-tooltip
              popper-class="max-w-25rem"
              :teleported="false"
              :content="t('chat.tti.guidanceScaleExp')"
              placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1.5rem w-full flex">
              <el-slider @change="update" show-input v-model="config.guidance_scale" :min="0" :max="20"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.negativePrompt") }}</el-text>
          <template #footer>
            <el-input @change="update" type="textarea" v-model="config.negative_prompt" autosize></el-input>
          </template>
        </ContentBox>
      </div>
    </DialogPanel>
  </el-popover>
</template>
<style lang="scss" scoped>
.tti-wrap {
  :deep(.el-form-item__label) {
    line-height: unset;
  }
}
</style>
