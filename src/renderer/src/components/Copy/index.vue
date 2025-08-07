<script setup lang="ts">
import useCopy from "@renderer/usable/useCopy"
const { copied, onCopy } = useCopy()
defineProps<{
  text: string
}>()
</script>
<template>
  <el-button type="primary" @click="onCopy(text)" size="small" round plain circle>
    <i-ic:outline-check v-if="copied"></i-ic:outline-check>
    <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
  </el-button>
</template>
<style lang="scss" scoped></style>
