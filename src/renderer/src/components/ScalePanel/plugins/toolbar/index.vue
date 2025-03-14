<template>
  <slot></slot>
  <Icon v-if="config.minimized" @click="tool.min">
    <i class="i-ic-round-indeterminate-check-box"></i>
  </Icon>
  <Icon v-if="config.maximized" @click="tool.max">
    <i v-if="isMax" class="i-ic:sharp-close-fullscreen"></i>
    <i v-else class="i-ic:baseline-open-in-full"></i>
  </Icon>
  <Icon v-if="config.closable" describe="关闭" @click="tool.close">
    <i class="i-ic:round-cancel"></i>
  </Icon>
</template>
<script lang="ts" setup>
import Icon from "../../components/icon.vue"
import { DragOffset, ScaleConfig } from "../../types"
import useHandle, { Status } from "../../useHandle"
import useScale from "../../useScale"
import { MoveType } from "@renderer/lib/drag"
const props = defineProps<{
  config: ScaleConfig
  scale?: ReturnType<typeof useScale>
  handle?: ReturnType<typeof useHandle>
  move?: MoveType
  dragOffset?: DragOffset
}>()
const isMax = ref(false)
const tool = {
  min: () => {
    void props.handle?.min(true)
  },
  max: async () => {
    const status = props.handle?.getStatus()
    if (status === Status.NORMAL) {
      await props.handle?.max(true)
    } else if (status === Status.MAX) {
      await props.handle?.maxToNormal(true)
    }
    isMax.value = props.handle?.getStatus() === Status.MAX
  },
  close: () => {
    void props.handle?.hideTo("self", true)
  },
}
</script>
