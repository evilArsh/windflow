<script setup lang="ts">
import { Message } from "@renderer/types"
import Markdown from "@renderer/components/Markdown/index.vue"

const props = defineProps<{
  message: Message
  finish: boolean
}>()
const { t } = useI18n()
const activeNames = ref<string[]>([])
const content = computed<string | undefined>(() => props.message.content as string)
const reasoning_content = computed<string | undefined>(() => props.message.reasoning_content)
const thinking = ref(true)

watch(
  [content, reasoning_content],
  (val, oldVal) => {
    if (props.finish) {
      thinking.value = false
      return
    }
    if (!val[0]) {
      if (val[1] && (!oldVal[1] || val[1] !== oldVal[1])) {
        thinking.value = true
      } else {
        thinking.value = false
      }
    } else {
      thinking.value = false
    }
    activeNames.value = thinking.value ? ["1"] : []
  },
  { immediate: true }
)
</script>
<template>
  <ContentBox v-if="reasoning_content">
    <el-collapse
      class="w-full"
      border="solid 1px [var(--el-collapse-border-color)]"
      v-model="activeNames"
      accordion
      expand-icon-position="right">
      <el-collapse-item name="1">
        <template #title>
          <div class="flex items-center gap-0.5rem">
            <Spinner v-if="thinking" :model-value="true" class="text-1.4rem font-bold"></Spinner>
            <i-fluent-emoji-flat:glowing-star v-else class="text-1.4rem"></i-fluent-emoji-flat:glowing-star>
            <el-text type="primary" loading>
              {{ thinking ? t("chat.thinking") : t("chat.thinkingComplete") }}
            </el-text>
          </div>
        </template>
        <ContentBox>
          <template #header>
            <Copy :text="reasoning_content"></Copy>
          </template>
          <Markdown v-if="reasoning_content" :content="reasoning_content"></Markdown>
        </ContentBox>
      </el-collapse-item>
    </el-collapse>
  </ContentBox>
</template>
<style lang="scss" scoped></style>
