<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Single from "./single.vue"
// import Handler from "./handler.vue"
// import Title from "./title.vue"
defineProps<{
  data: ChatMessageData[]
  parent: ChatMessageData
}>()
const id = useId()
</script>
<template>
  <MsgBubble :id>
    <template #header>
      <el-affix :offset="40" :target="`#${id}`">
        <!-- <Title :data>
          <Handler :data @edit="rawTextDlg.edit(data)"></Handler>
        </Title> -->
      </el-affix>
    </template>
    <div class="chat-item-content">
      <Single v-for="item in data" :data="item" :key="item.id" class="flex-1"></Single>
    </div>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-content {
  padding: 1rem;
  flex: 1;
  display: flex;
  font-size: 1.4rem;
  gap: 1rem;
}
</style>
