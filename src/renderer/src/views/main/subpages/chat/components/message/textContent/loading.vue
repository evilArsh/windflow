<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
defineProps<{
  data: ChatMessageData
}>()
const { t } = useI18n()
</script>
<template>
  <div class="flex flex-col gap-0.5rem">
    <div>
      <el-button v-show="data.status == 100 && data.reasoning" type="primary" loading size="small">
        {{ t("chat.thinking") }}
      </el-button>
    </div>
    <div>
      <el-text v-show="data.content.reasoning_content" type="success" class="self-start!">
        {{ data.content.reasoning_content }}
      </el-text>
    </div>
    <div>
      <el-text v-show="data.status == 100" type="primary" size="small">
        <i-eos-icons:three-dots-loading class="text-4rem"></i-eos-icons:three-dots-loading>
      </el-text>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
