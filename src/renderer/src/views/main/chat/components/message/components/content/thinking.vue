<script setup lang="ts">
import { Message } from "@windflow/core/types"
import Markdown from "@renderer/components/Markdown/index.vue"
import { Spinner } from "@toolmain/components"
import { CollapseActiveName, CollapseModelValue } from "element-plus"

const props = defineProps<{
  message: Message
  finish: boolean
}>()
const { t } = useI18n()
const content = computed<string | undefined>(() => props.message.content as string)
const reasoning_content = computed<string | undefined>(() => props.message.reasoning_content)
const finish = computed<boolean>(() => props.finish)
const useThinking = () => {
  const activeNames = ref<CollapseActiveName>("")
  const manuallyTriggered = ref(false)
  const thinking = ref(true)
  function openCollapse() {
    if (manuallyTriggered.value) return
    activeNames.value = "1"
  }
  function closeCollapse(force?: boolean) {
    if (force || !manuallyTriggered.value) {
      activeNames.value = ""
    }
  }
  function thinkStart() {
    thinking.value = true
  }
  function thinkStop() {
    thinking.value = false
  }
  function onCollapseChange(val: CollapseModelValue) {
    activeNames.value = val as CollapseActiveName
  }
  function onClick() {
    manuallyTriggered.value = true
  }
  return { activeNames, thinking, openCollapse, closeCollapse, thinkStart, thinkStop, onCollapseChange, onClick }
}
const { activeNames, thinking, ...th } = useThinking()
watch(
  [content, reasoning_content, finish],
  (val, oldVal) => {
    if (val[2]) {
      th.thinkStop()
      th.closeCollapse(true)
      return
    }
    // no_content && reasoning_content && [ no_old_reasoning_content || reasoning_content !== old_reasoning_content ]
    if (!val[0] && val[1] && (!oldVal[1] || val[1] !== oldVal[1])) {
      th.thinkStart()
      th.openCollapse()
    } else {
      th.thinkStop()
      th.closeCollapse()
    }
  },
  { immediate: true }
)
</script>
<template>
  <el-collapse
    v-if="reasoning_content"
    class="w-full"
    border="solid 1px [var(--el-collapse-border-color)]"
    v-model="activeNames"
    @click.stop="th.onClick"
    @update:model-value="th.onCollapseChange"
    accordion
    expand-icon-position="right">
    <el-collapse-item name="1">
      <template #title>
        <div class="flex items-center gap-0.5rem px-1.5rem">
          <Spinner v-if="thinking" :model-value="true" class="text-1.4rem font-bold"></Spinner>
          <i-fluent-emoji-flat-glowing-star v-else class="text-1.4rem"></i-fluent-emoji-flat-glowing-star>
          <el-text type="primary" loading>
            {{ thinking ? t("chat.thinking") : t("chat.thinkingComplete") }}
          </el-text>
        </div>
      </template>
      <Markdown class="p-[var(--ai-gap-base)]" v-if="reasoning_content" :content="reasoning_content"></Markdown>
    </el-collapse-item>
  </el-collapse>
</template>
<style lang="scss" scoped></style>
