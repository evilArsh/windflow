<script setup lang="ts">
import { ChatMessage, ChatMessageTree } from "@windai/core/types"
import { code1xx, isString, isUndefined } from "@toolmain/shared"
import { useSrc } from "@renderer/hooks/useSrc"

const props = defineProps<{
  message: ChatMessageTree
}>()
const message = computed(() => props.message.node)

const { data, isPending, ...src } = useSrc()
const finished = computed(() => message.value.finish)
const statusDone = computed(() => !code1xx(message.value.status) && message.value.status !== 206)
const done = computed(() => !isPending.value && finished.value && statusDone.value)
const imgData = computed(() =>
  data.value.map(v => (v.type === "image" && isString(v.data) ? v.data : undefined)).filter(v => !isUndefined(v))
)
function onMessageChange(value: ChatMessage) {
  src.retrieveFromDB(value.mediaIds)
}
watch(
  () => message.value.mediaIds,
  () => onMessageChange(message.value)
)
onBeforeMount(() => {
  onMessageChange(message.value)
})
onBeforeUnmount(src.dispose)
</script>
<template>
  <div class="flex gap-.5rem">
    <el-skeleton v-for="(img, index) in imgData" :key="index" class="w-2rem" :loading="!done" animated>
      <template #template>
        <el-skeleton-item variant="image" class="w-2rem h-2rem" />
      </template>
      <template #default>
        <el-image
          preview-teleported
          :preview-src-list="imgData"
          :src="img"
          :initial-index="index"
          loading="lazy"></el-image>
      </template>
    </el-skeleton>
  </div>
</template>
<style lang="scss" scoped></style>
