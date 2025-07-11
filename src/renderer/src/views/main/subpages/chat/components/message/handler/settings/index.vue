<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import Global from "./global.vue"
import Message from "./message.vue"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
</script>
<template>
  <el-popover trigger="hover" :width="500" popper-style="--el-popover-padding: 0">
    <template #reference>
      <ContentBox background>
        <i-fluent-emoji-flat:gear class="text-1.6rem" />
      </ContentBox>
    </template>
    <DialogPanel>
      <template #header>
        <el-text>{{ t("chat.settings.label") }}</el-text>
      </template>
      <div class="w-full h-40rem flex flex-col gap-1rem">
        <ContentBox
          background
          default-lock
          style="--box-active-shadow-color: transparent; --box-active-bg-color: #f5f5f5">
          <el-text type="primary">{{ t("chat.settings.messageLabel") }}</el-text>
          <template #footer>
            <Message :topic></Message>
          </template>
        </ContentBox>
        <ContentBox
          background
          default-lock
          style="--box-active-shadow-color: transparent; --box-active-bg-color: #f5f5f5">
          <el-text type="primary">{{ t("chat.settings.inputLabel") }}</el-text>
          <template #footer>
            <Global :topic></Global>
          </template>
        </ContentBox>
      </div>
    </DialogPanel>
  </el-popover>
</template>
<style lang="scss" scoped></style>
