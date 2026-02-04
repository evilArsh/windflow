<script setup lang="ts">
import ILeft from "~icons/material-symbols/left-panel-close-outline"
import IRight from "~icons/material-symbols/right-panel-close-outline"

const emit = defineEmits<{
  click: []
}>()
const props = defineProps<{
  toggle: boolean
  position?: "left" | "right"
}>()
const isLeft = computed(() => props.position !== "right")
</script>
<template>
  <ContentBox @click="emit('click')">
    <component :is="isLeft ? ILeft : IRight" v-if="toggle"></component>
    <component :is="isLeft ? IRight : ILeft" v-else></component>
  </ContentBox>
</template>
