<script setup lang="ts">
import { Media } from "@windflow/core/types"

defineProps<{
  data: Media
}>()
</script>
<template>
  <div class="w-15rem h-3rem flex items-center gap-[var(--ai-gap-base)]">
    <i-ic-baseline-photo-camera-back
      v-if="data.type === 'image'"
      class="flex-shrink-0 text-2.8rem w-2.8rem h-2.8rem"></i-ic-baseline-photo-camera-back>
    <i-ic-baseline-volume-up
      v-else-if="data.type === 'audio'"
      class="flex-shrink-0 text-2.8rem w-2.8rem h-2.8rem"></i-ic-baseline-volume-up>
    <i-ic-sharp-videocam
      v-else-if="data.type === 'video'"
      class="flex-shrink-0 text-2.8rem w-2.8rem h-2.8rem"></i-ic-sharp-videocam>
    <i-ep-document v-else class="flex-shrink-0 text-2.8rem w-2.8rem h-2.8rem"></i-ep-document>
    <div class="flex flex-col justify-start overflow-hidden">
      <el-text truncated :line-clamp="1">{{ data.name }}</el-text>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
