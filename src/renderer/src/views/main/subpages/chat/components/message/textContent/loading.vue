<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import Markdown from "@renderer/components/Markdown/index.vue"

const props = defineProps<{
  messageItem: ChatMessageData
}>()
const { t } = useI18n()
const activeNames = ref<string[]>([])
const regex = /[\r\n ]+/g
const content = computed<string>(() => props.messageItem.content.content as string)
const thinking = computed(
  () => !content.value || (content.value.length < 5 && content.value.replace(regex, "").length == 0)
)
watch(
  thinking,
  v => {
    if (v) {
      activeNames.value = ["1"]
    } else {
      activeNames.value = []
    }
  },
  { immediate: true }
)
</script>
<template>
  <div v-if="messageItem.content.reasoning_content" class="flex flex-col gap-0.5rem">
    <el-collapse v-model="activeNames" accordion expand-icon-position="left">
      <el-collapse-item name="1">
        <template #title>
          <div class="flex items-center gap-0.5rem">
            <i-svg-spinners:8-dots-rotate v-if="thinking" class="text-1.4rem"></i-svg-spinners:8-dots-rotate>
            <i-fluent-emoji-flat:glowing-star v-else class="text-1.4rem"></i-fluent-emoji-flat:glowing-star>
            <el-text type="primary" loading>
              {{ thinking ? t("chat.thinking") : t("chat.thinkingComplete") }}
            </el-text>
          </div>
        </template>
        <Markdown
          v-if="messageItem.content.reasoning_content"
          :content="messageItem.content.reasoning_content"></Markdown>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<style lang="scss" scoped></style>
