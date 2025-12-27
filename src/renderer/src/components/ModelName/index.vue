<script lang="ts" setup>
import { ModelMeta, ModelType } from "@windflow/core/types"
import flashlight from "~icons/fluent-emoji-flat/flashlight"
import speech from "~icons/twemoji/speech-balloon"
import gear from "~icons/fluent-emoji-flat/gear"
import hammer from "~icons/fluent-emoji-flat/hammer-and-wrench"
import picture from "~icons/fluent-emoji-flat/framed-picture"
import film from "~icons/fluent-emoji-flat/film-frames"
import feather from "~icons/fluent-emoji-flat/feather"
import bouquet from "~icons/twemoji/bouquet"
import speaker from "~icons/twemoji/speaker-high-volume"
import ear from "~icons/twemoji/ear-light-skin-tone"
defineProps<{
  data: ModelMeta
}>()

const { t } = useI18n()
const iconMap = {
  [ModelType.Chat]: h(speech),
  [ModelType.ChatReasoner]: h(flashlight),
  [ModelType.Embedding]: h(gear),
  [ModelType.Reranker]: h(hammer),
  [ModelType.TextToImage]: h(picture),
  [ModelType.ImageToImage]: h(bouquet),
  [ModelType.ImageToText]: h(feather),
  [ModelType.TextToVideo]: h(film),
  [ModelType.SpeechToText]: h(ear),
  [ModelType.TextToSpeech]: h(speaker),
}
</script>
<template>
  <div class="flex gap.5rem items-center">
    <ContentBox class="flex-none! flex items-center justify-center">
      <Svg class="w-1.8rem h-1.8rem" :src="data.icon"></Svg>
    </ContentBox>
    <el-text class="flex-1" line-clamp="1">{{ data.modelName }}</el-text>
    <div class="flex gap.25rem flex-shrink-0">
      <ContentBox v-for="type in data.type" :key="type">
        <el-tooltip :content="t(`modelType.${type}`)" placement="top" :teleported="false">
          <component :is="iconMap[type]"></component>
        </el-tooltip>
      </ContentBox>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
