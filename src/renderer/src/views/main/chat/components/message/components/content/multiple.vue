<script setup lang="ts">
import { ChatMessageTree, ChatTopic } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Single from "./single.vue"
import Handler from "./handler.vue"
import useChatStore from "@renderer/store/chat"
import IconLeftToRight from "~icons/ic/baseline-format-line-spacing"
import IconGrid from "~icons/ic/baseline-grid-on"
import Tab from "~icons/ic/outline-folder-copy"
import Title from "./title.vue"
import { CSSProperties, isString, msg, errorToText } from "@toolmain/shared"
import type { Primitive } from "type-fest"
import { useThrottleFn } from "@vueuse/core"
import { useMsgContext } from "../../../../index"
const props = defineProps<{
  message: ChatMessageTree
  topic: ChatTopic
  context: ReturnType<typeof useMsgContext>
}>()
const id = useId()
const chatStore = useChatStore()
const message = computed(() => props.message)
const messageChildren = computed<ChatMessageTree[] | undefined>(() => {
  if (layout.type === types.Tab) {
    return message.value?.children?.filter(item => item.id === layout.currentTabId)
  } else {
    return message.value.children
  }
})
const childLength = computed(() => message.value.children?.length ?? 0)
const affixRefs = ref<InstanceType<typeof Single>[]>([])
const types = {
  Grid: "grid",
  L2R: "l2r",
  Tab: "tab",
}
const layout = shallowReactive({
  type: types.Grid,
  currentTabId: "",
  sliderStep: 1,
  sliderValue: 1,
  sliderMin: 1,
  sliderMax: 1,
  typeList: [
    { label: h(IconGrid), value: types.Grid },
    { label: h(IconLeftToRight, { class: "rotate-z-90" }), value: types.L2R },
    { label: h(Tab), value: types.Tab },
  ],
  onTypeChange: (type: Primitive) => {
    if (!isString(type)) return
    if (type === types.Grid) {
      layout.sliderStep = 1
      layout.sliderValue = Math.max(1, Math.ceil(childLength.value / 2))
      layout.sliderMin = 1
      layout.sliderMax = Math.max(1, childLength.value)
    } else if (type === types.L2R) {
      const defaultValue = Math.trunc((1 / childLength.value) * 100)
      layout.sliderStep = 10
      layout.sliderValue = defaultValue
      layout.sliderMin = defaultValue
      layout.sliderMax = 100
    } else if (type === types.Tab) {
      if (!layout.currentTabId) {
        if (message.value.children?.length) {
          layout.currentTabId = message.value.children[0].id
        }
      }
    }
  },
  onTabChange: (childId: Primitive) => {
    if (!isString(childId)) return
    layout.currentTabId = childId
  },
  onItemContentScroll: useThrottleFn(
    () => {
      if (affixRefs.value.length <= 1) return
      affixRefs.value.forEach(refs => {
        refs.update()
      })
    },
    250,
    true
  ),
})
const containerStyle = computed<CSSProperties>(() => {
  switch (layout.type) {
    case types.Grid:
      return {
        flex: 1,
        display: "grid",
        gridTemplateColumns: `repeat(${layout.sliderValue}, 1fr)`,
        gridTemplateRows: "1fr",
        gap: "var(--ai-gap-medium)",
        flexDirection: "row",
      }
    case types.L2R:
      return {
        flex: 1,
        display: "flex",
        gap: "var(--ai-gap-medium)",
        overflow: "auto",
      }
    case types.Tab:
      return {
        flex: 1,
      }
  }
  return {}
})
const itemStyle = computed<CSSProperties>(() => {
  switch (layout.type) {
    case types.Grid:
      return {}
    case types.L2R:
      return {
        width: `${layout.sliderValue}%`,
        flexShrink: 0,
      }
    case types.Tab:
      return {}
  }
  return {}
})
async function del() {
  try {
    await chatStore.deleteMessage(props.topic, message.value)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
onMounted(() => {
  layout.onTypeChange(layout.type)
})
</script>
<template>
  <MsgBubble :id>
    <template #header>
      <div class="flex-1 flex items-center px-1rem py-.5rem flex-wrap overflow-hidden">
        <Handler hide-edit :topic :message @delete="del"></Handler>
        <ContentBox background class="m0! flex-shrink-0">
          <el-radio-group v-model="layout.type" size="small" fill="#6cf" @change="layout.onTypeChange">
            <el-radio-button v-for="item in layout.typeList" :label="item.value" :value="item.value" :key="item.value">
              <component :is="item.label"></component>
            </el-radio-button>
          </el-radio-group>
        </ContentBox>
        <el-tabs
          v-model="layout.currentTabId"
          v-if="layout.type === types.Tab"
          class="w100%"
          @tab-change="layout.onTabChange"
          style="--el-tabs-header-height: auto; --el-border-color-light: transparent">
          <el-tab-pane v-for="item in message.children" :key="item.id" :name="item.id">
            <template #label>
              <div class="flex-shrink-0">
                <Title style="--title-bg-color: transparent" :message="item" hide-time hide-provider hide-token></Title>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>
        <div v-else class="w100% flex px-1.5rem">
          <el-slider
            v-model="layout.sliderValue"
            :min="layout.sliderMin"
            :max="layout.sliderMax"
            :step="layout.sliderStep"
            show-stops />
        </div>
      </div>
    </template>
    <div class="chat-item-content" @scroll="layout.onItemContentScroll" :style="containerStyle">
      <Single
        v-for="(item, index) in messageChildren"
        :ref="ref => (affixRefs[index] = ref as InstanceType<typeof Single>)"
        :style="itemStyle"
        :parent="message"
        :context
        :topic
        :message="item"
        :key="item.id"
        header></Single>
    </div>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-content {
  padding: 1rem;
  font-size: 1.4rem;
}
</style>
