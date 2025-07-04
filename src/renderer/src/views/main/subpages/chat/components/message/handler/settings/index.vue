<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import ShortCut from "./shortcut.vue"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const pop = shallowReactive({
  visible: false,
  closeTimeout: 0,
  open() {
    clearTimeout(pop.closeTimeout)
    pop.visible = true
  },
  close() {
    pop.closeTimeout = window.setTimeout(() => {
      pop.visible = false
    }, 500)
  },
})
</script>
<template>
  <el-popover :visible="pop.visible" :width="500" popper-style="--el-popover-padding: 0">
    <template #reference>
      <ContentBox background @mouseenter="pop.open" @mouseleave="pop.close">
        <i-material-symbols:display-settings-outline class="text-1.6rem" />
      </ContentBox>
    </template>
    <DialogPanel @mouseenter="pop.open" @mouseleave="pop.close">
      <template #header>
        <el-text>{{ t("chat.settings.label") }}</el-text>
      </template>
      <div class="w-full h-30rem flex flex-col">
        <ShortCut :topic></ShortCut>
      </div>
    </DialogPanel>
  </el-popover>
</template>
<style lang="scss" scoped></style>
