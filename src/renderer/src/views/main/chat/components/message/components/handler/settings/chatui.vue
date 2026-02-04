<script lang="ts" setup>
import { ChatTopic } from "@windflow/core/types"
import Group from "../components/group.vue"
import Item from "../components/item.vue"
import { ChatPanelWidthStyle } from "@windflow/core/types"
import { useChatListDisplayStyle, useChatPanelWidth } from "./hooks"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const { chatListDisplay, chatListDisplayList } = useChatListDisplayStyle()
const { chatPanelType, width, onChatPanelTypeChange, chatPanelWidthList } = useChatPanelWidth()
</script>
<template>
  <Group>
    <Item :title="t('chat.settings.ChatListDisplayStyle')" icon-class="i-ic-outline-chat-bubble-outline">
      <el-segmented class="custom-segmented" v-model="chatListDisplay" :options="chatListDisplayList" />
    </Item>
    <Item :title="t('chat.settings.chatPanelWidth')" icon-class="i-ic-twotone-width-normal">
      <el-segmented
        class="custom-segmented"
        :model-value="chatPanelType"
        @update:model-value="onChatPanelTypeChange"
        :options="chatPanelWidthList" />
      <template v-if="chatPanelType === ChatPanelWidthStyle.Custom" #footer>
        <el-slider show-input v-model="width" :min="50" :max="100" :step="1"></el-slider>
      </template>
    </Item>
  </Group>
</template>
<style lang="scss" scoped>
.custom-segmented {
  --el-border-radius-base: var(--ai-gap-base);
}
</style>
