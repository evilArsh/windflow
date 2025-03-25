<script setup lang="ts">
import openmoji from "@iconify/json/json/openmoji.json"
import twemoji from "@iconify/json/json/twemoji.json"
import noto from "@iconify/json/json/noto.json"
// import fluentEmojiFlat from "@iconify/json/json/fluent-emoji-flat.json"
// import fluentEmoji from "@iconify/json/json/fluent-emoji.json"
import emojione from "@iconify/json/json/emojione.json"
import emojionev1 from "@iconify/json/json/emojione-v1.json"
import fxemoji from "@iconify/json/json/fxemoji.json"
import streamline from "@iconify/json/json/streamline-emojis.json"
import flagCircle from "@iconify/json/json/circle-flags.json"
import type { IconifyJSON } from "@iconify/types"
import SvgPanel from "./panel.vue"
import Svg from "@renderer/components/Svg/index.vue"
defineProps<{
  modelValue: string
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const key = ref("")
const tabs = reactive({
  active: "openmoji",
})

const iconMap: Record<string, IconifyJSON> = {
  openmoji: openmoji as IconifyJSON,
  twemoji: twemoji as IconifyJSON,
  noto: noto as IconifyJSON,
  // fluentEmojiFlat: fluentEmojiFlat as IconifyJSON,
  // fluentEmoji: fluentEmoji as IconifyJSON,
  emojione: emojione as IconifyJSON,
  emojionev1: emojionev1 as IconifyJSON,
  fxemoji: fxemoji as IconifyJSON,
  streamline: streamline as IconifyJSON,
  flagCircle: flagCircle as IconifyJSON,
}

onMounted(() => {
  // console.log(res)
})
</script>
<template>
  <div class="flex flex-col gap-1rem w-full">
    <div class="flex gap-1rem">
      <el-button class="w-3.5rem h-3.5rem">
        <Svg :src="modelValue" class="text-25px"></Svg>
      </el-button>
      <el-input v-model="key"></el-input>
    </div>
    <el-tabs v-model="tabs.active">
      <el-tab-pane v-for="(_, name) in iconMap" :label="name" :name="name" :key="name"> </el-tab-pane>
    </el-tabs>
    <SvgPanel :icon-map="iconMap[tabs.active]" @change="emit('update:modelValue', $event)"></SvgPanel>
  </div>
</template>
