<script setup lang="ts">
import openmoji from "@iconify/json/json/openmoji.json"
import noto from "@iconify/json/json/noto.json"
import fluentEmojiFlat from "@iconify/json/json/fluent-emoji-flat.json"
import emojione from "@iconify/json/json/emojione.json"
import streamline from "@iconify/json/json/streamline-emojis.json"
import flag from "@iconify/json/json/circle-flags.json"
import type { IconifyJSON } from "@iconify/types"
import SvgPanel from "./panel.vue"
import Svg from "@renderer/components/Svg/index.vue"
import openmojiDefault from "~icons/openmoji/1st-place-medal"
import notoDefault from "~icons/noto/1st-place-medal"
import fluentEmojiFlatDefault from "~icons/fluent-emoji-flat/basketball"
import emojioneDefault from "~icons/emojione/flushed-face"
import streamlineDefault from "~icons/streamline-emojis/boar-1"
import flagDefault from "~icons/circle-flags/cn"
import type { Component } from "vue"

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

const iconMap: Record<string, { title: Component; icons: IconifyJSON }> = {
  openmoji: { title: openmojiDefault, icons: openmoji as IconifyJSON },
  noto: { title: notoDefault, icons: noto as IconifyJSON },
  fluentEmojiFlat: { title: fluentEmojiFlatDefault, icons: fluentEmojiFlat as IconifyJSON },
  emojione: { title: emojioneDefault, icons: emojione as IconifyJSON },
  streamline: { title: streamlineDefault, icons: streamline as IconifyJSON },
  flag: { title: flagDefault, icons: flag as IconifyJSON },
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
    <el-tabs class="emoji-tabs" v-model="tabs.active">
      <el-tab-pane v-for="(item, name) in iconMap" :label="name" :name="name" :key="name">
        <template #label>
          <el-button>
            <component class="text-20px" :is="item.title"></component>
          </el-button>
        </template>
      </el-tab-pane>
    </el-tabs>
    <SvgPanel :icon-map="iconMap[tabs.active].icons" @change="emit('update:modelValue', $event)"></SvgPanel>
  </div>
</template>
<style lang="scss" scoped>
.emoji-tabs.el-tabs {
  :deep(.el-tabs__item) {
    padding: 0 5px;
  }
}
</style>
