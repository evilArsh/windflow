<script setup lang="ts">
import { ChatMessageTree, ChatTopic } from "@windflow/core/types"
import { Affix } from "@toolmain/components"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Single from "./single.vue"
import Handler from "./handler.vue"
import useChatStore from "@renderer/store/chat"
import useModelsStore from "@renderer/store/model"
import IconLeftToRight from "~icons/ic/baseline-format-line-spacing"
import IconGrid from "~icons/ic/baseline-grid-on"
import Tab from "~icons/ic/outline-folder-copy"
import Title from "./title.vue"
import { CSSProperties, isString, errorToText, CallBackFn } from "@toolmain/shared"
import type { Primitive } from "type-fest"
import { useThrottleFn } from "@vueuse/core"
import { useMsgContext } from "../../../../index"
import { msg } from "@renderer/utils"
const props = defineProps<{
  message: ChatMessageTree
  topic: ChatTopic
  context: ReturnType<typeof useMsgContext>
}>()
const types = {
  Grid: "grid",
  L2R: "l2r",
  Tab: "tab",
}

const id = useId()
const chatStore = useChatStore()
const modelsStore = useModelsStore()
const message = computed(() => props.message)
const svgSrc = computed(() =>
  modelsStore.getModelLogo(message.value.node.modelId ? modelsStore.find(message.value.node.modelId) : undefined)
)
const childLength = computed(() => message.value.children?.length ?? 0)
const useLayout = () => {
  const affixRefs = ref<InstanceType<typeof Single>[]>([])
  const type = ref(types.Grid)
  const currentTabId = ref("")
  const sliderStep = ref(1)
  const sliderValue = ref(1)
  const sliderMin = ref(1)
  const sliderMax = ref(1)
  const typeList = shallowRef([
    { label: h(IconGrid), value: types.Grid },
    { label: h(IconLeftToRight, { class: "rotate-z-90" }), value: types.L2R },
    { label: h(Tab), value: types.Tab },
  ])
  const messageChildren = computed<ChatMessageTree[] | undefined>(() => {
    if (type.value === types.Tab) {
      return message.value?.children?.filter(item => item.id === currentTabId.value)
    } else {
      return message.value.children
    }
  })
  function onTypeChange(type: Primitive) {
    if (!isString(type)) return
    if (type === types.Grid) {
      sliderStep.value = 1
      sliderValue.value = Math.max(1, Math.ceil(childLength.value / 2))
      sliderMin.value = 1
      sliderMax.value = Math.max(1, childLength.value)
    } else if (type === types.L2R) {
      const defaultValue = Math.trunc((1 / childLength.value) * 100)
      sliderStep.value = 10
      sliderValue.value = defaultValue
      sliderMin.value = defaultValue
      sliderMax.value = 100
    } else if (type === types.Tab) {
      if (!currentTabId.value) {
        if (message.value.children?.length) {
          currentTabId.value = message.value.children[0].id
        }
      }
    }
  }
  function onTabChange(childId: Primitive) {
    if (!isString(childId)) return
    currentTabId.value = childId
  }
  const onItemContentScroll = useThrottleFn(
    () => {
      if (affixRefs.value.length <= 1) return
      affixRefs.value.forEach(refs => {
        refs.update()
      })
    },
    250,
    true
  )
  return {
    type,
    affixRefs,
    currentTabId,
    sliderStep,
    sliderValue,
    sliderMin,
    sliderMax,
    typeList,
    messageChildren,
    onTypeChange,
    onItemContentScroll,
    onTabChange,
  }
}
const {
  type,
  affixRefs,
  currentTabId,
  sliderStep,
  sliderValue,
  sliderMin,
  sliderMax,
  typeList,
  messageChildren,
  onTypeChange,
  onItemContentScroll,
  onTabChange,
} = useLayout()

const containerStyle = computed<CSSProperties>(() => {
  switch (type.value) {
    case types.Grid:
      return {
        flex: 1,
        display: "grid",
        gridTemplateColumns: `repeat(${sliderValue.value}, 1fr)`,
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
  switch (type.value) {
    case types.Grid:
      return {}
    case types.L2R:
      return {
        width: `${sliderValue.value}%`,
        flexShrink: 0,
      }
    case types.Tab:
      return {}
  }
  return {}
})
async function del(done: CallBackFn) {
  try {
    await chatStore.deleteMessage(message.value)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  } finally {
    done()
  }
}
onMounted(() => {
  onTypeChange(type.value)
})
</script>
<template>
  <MsgBubble :id>
    <template v-if="svgSrc" #icon>
      <Affix
        style="--affix-fix-shadow: none; --affix-fix-bg-color: var(--el-bg-color)"
        ref="affixIcon"
        :offset="88"
        :target="`#${id}`">
        <ContentBox class="m0! flex-shrink-0">
          <Svg :src="svgSrc" class="flex-1 text-3rem"></Svg>
        </ContentBox>
      </Affix>
    </template>
    <template #header>
      <div class="flex-1 flex items-center px-1rem py-.5rem flex-wrap overflow-hidden">
        <Handler hide-edit :topic :message @delete="del"></Handler>
        <ContentBox class="m0! flex-shrink-0">
          <el-radio-group v-model="type" size="small" @change="onTypeChange">
            <el-radio-button v-for="item in typeList" :label="item.value" :value="item.value" :key="item.value">
              <component :is="item.label"></component>
            </el-radio-button>
          </el-radio-group>
        </ContentBox>
        <el-tabs
          v-model="currentTabId"
          v-if="type === types.Tab"
          class="w100%"
          @tab-change="onTabChange"
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
          <el-slider v-model="sliderValue" :min="sliderMin" :max="sliderMax" :step="sliderStep" show-stops />
        </div>
      </div>
    </template>
    <div class="chat-item-content" @scroll="onItemContentScroll" :style="containerStyle">
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
