<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import ShortCut from "./shortcut.vue"
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
      <div class="w-full h-40rem flex flex-col">
        <ShortCut :topic></ShortCut>
      </div>
    </DialogPanel>
  </el-popover>
</template>
<style lang="scss" scoped></style>
