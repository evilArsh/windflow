<script lang="ts" setup>
import ChatItem from "./chat-item.vue"
import ChatInput from "./chat-input.vue"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
</script>
<template>
  <ContentLayout handler-height="20rem">
    <template #content>
      <ChatItem v-for="item in 4" :key="item"></ChatItem>
    </template>
    <template #handler>
      <ChatInput></ChatInput>
    </template>
  </ContentLayout>
</template>
<style lang="scss" scoped></style>
