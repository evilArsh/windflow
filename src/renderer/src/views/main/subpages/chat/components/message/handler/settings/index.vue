<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import ShortCut from "./shortcut.vue"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
// const _topicData = computed<ChatTopic>(() => props.topic)
</script>
<template>
  <el-popover placement="top" :width="500" trigger="hover" popper-style="--el-popover-padding: 0">
    <template #reference>
      <ContentBox background>
        <i-ic:baseline-display-settings class="text-1.4rem" />
      </ContentBox>
    </template>
    <DialogPanel>
      <template #header>
        <el-text>{{ t("chat.settings.label") }}</el-text>
      </template>
    </DialogPanel>
    <div class="w-full h-30rem flex flex-col">
      <ShortCut></ShortCut>
    </div>
  </el-popover>
</template>
<style lang="scss" scoped></style>
