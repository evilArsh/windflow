<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@renderer/types"
import Chance from "chance"
const settingsStore = useSettingsStore()
const { t } = useI18n()
const chance = markRaw(new Chance())
const sizeOptions = ref([
  {
    value: "1024x1024",
    label: "1:1 (1024×1024)",
  },
  {
    value: "1024x2048",
    label: "1:2 (1024×2048)",
  },
  {
    value: "1536x1024",
    label: "3:2 (1536×1024)",
  },
  {
    value: "768x1024",
    label: "3:4 (768×1024)",
  },
  {
    value: "1820x1024",
    label: "16:9 (1820×1024)",
  },
  {
    value: "1024x1820",
    label: "9:16 (1024×1820)",
  },
  {
    value: "1365x1024",
    label: "4:3 (1365×1024)",
  },
  {
    value: "1024x1365",
    label: "3:4 (1024×1365)",
  },
])
const defaultConfig = () => ({
  size: "",
  image_size: "", // siliconflow: image_size ===  size

  n: 1,
  batch_size: 1, // siliconflow: batch_size === n

  num_inference_steps: 20, // siliconflow
  guidance_scale: 7.5, // siliconflow
  negative_prompt: "", // siliconflow
  seed: 0,
})
const config = reactive(defaultConfig())
function onRandSeed() {
  config.seed = chance.integer({ min: 0, max: 99999999 })
}
function onChange() {
  config.image_size = config.size
  config.batch_size = config.n
}
settingsStore.api.dataWatcher<ReturnType<typeof defaultConfig>>(
  SettingKeys.ChatTextToImageConfig,
  config,
  defaultConfig()
)
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
      <div class="tti-wrap h-40rem w-full flex flex-col">
        <ContentBox>
          <el-text>{{ t("chat.tti.imageSize") }}</el-text>
          <template #footer>
            <el-select v-model="config.size" @change="onChange" :teleported="false" append-to=".size-anchor">
              <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.n") }}</el-text>
          <template #footer>
            <div class="px-1.5rem w-full flex">
              <el-slider @change="onChange" v-model="config.n" :min="1" :max="4"></el-slider>
            </div>
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
          <el-text>{{ t("chat.tti.inferenceSteps") }}</el-text>
          <template #end>
            <el-tooltip :content="t('chat.tti.inferenceStepsExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1.5rem w-full flex">
              <el-slider v-model="config.num_inference_steps" :min="1" :max="100"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.guidanceScale") }}</el-text>
          <template #end>
            <el-tooltip :content="t('chat.tti.guidanceScaleExp')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
          <template #footer>
            <div class="px-1.5rem w-full flex">
              <el-slider v-model="config.guidance_scale" :min="0" :max="20"></el-slider>
            </div>
          </template>
        </ContentBox>
        <el-divider class="my-.25rem!"></el-divider>
        <ContentBox>
          <el-text>{{ t("chat.tti.negativePrompt") }}</el-text>
          <template #footer>
            <el-input type="textarea" v-model="config.negative_prompt" autosize></el-input>
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
