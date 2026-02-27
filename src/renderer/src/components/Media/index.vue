<script setup lang="ts">
import { msgError } from "@renderer/utils"
import { CallBackFn, errorToText } from "@toolmain/shared"
import { Media } from "@windflow/core/types"
import { filesize } from "filesize"

const props = defineProps<{
  data: Media
}>()
async function onOpen(_: MouseEvent, done?: CallBackFn) {
  try {
    if (window.api) {
      if (props.data.path) {
        await window.api.file.open(props.data.path)
      } else {
        // TODO: video audio play
      }
    }
  } catch (error) {
    msgError(errorToText(error))
  } finally {
    done?.()
  }
}
</script>
<template>
  <ContentBox class="media-box" background @click="onOpen" button>
    <template #icon>
      <i-ic-baseline-photo-camera-back v-if="data.type === 'image'" class="icon"></i-ic-baseline-photo-camera-back>
      <i-ic-baseline-volume-up v-else-if="data.type === 'audio'" class="icon"></i-ic-baseline-volume-up>
      <i-ic-sharp-videocam v-else-if="data.type === 'video'" class="icon"></i-ic-sharp-videocam>
      <i-ep-document v-else class="icon"></i-ep-document>
    </template>
    <div class="flex flex-col items-start justify-center overflow-hidden">
      <el-text class="self-start!" truncated :line-clamp="1">{{ data.name }}</el-text>
      <div class="flex items-center gap-[var(--ai-gap-base)]">
        <el-text class="self-start!" truncated size="small" type="primary" :line-clamp="1">
          {{ data.extension }}
        </el-text>
        <el-text class="self-start!" truncated size="small" type="info" :line-clamp="1">
          {{ filesize(data.size ?? 0) }}
        </el-text>
      </div>
    </div>
  </ContentBox>
</template>
<style lang="scss" scoped>
.icon {
  flex-shrink: 0;
  font-size: 2.8rem;
  width: 2.8rem;
  height: 2.8rem;
}
.media-box {
  --box-padding: var(--ai-gap-base) var(--ai-gap-large) var(--ai-gap-base) var(--ai-gap-base);
}
</style>
