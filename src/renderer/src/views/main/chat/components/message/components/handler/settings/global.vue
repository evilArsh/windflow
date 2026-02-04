<script lang="ts" setup>
import { ChatTopic, SettingKeys } from "@windflow/core/types"
import ShortcutItem from "../components/shortcutItem.vue"
import Group from "../components/group.vue"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const sendShortcutList = shallowRef([
  { label: "enter", value: "enter" },
  { label: "ctrl + enter", value: "ctrl+enter" },
  { label: "shift + enter", value: "shift+enter" },
])
const cleanMessageList = shallowRef([{ label: "ctrl + l", value: "ctrl+l" }])
const cleanContextList = shallowRef([{ label: "ctrl + k", value: "ctrl+k" }])
const simpleModeShortcutList = shallowRef([{ label: "ctrl + ↓", value: "ctrl+arrowDown" }])
const newChatList = shallowRef([{ label: "ctrl + n", value: "ctrl+n" }])
const newSubChatList = shallowRef([{ label: "ctrl + shift + n", value: "ctrl+shift+n" }])
const sidebarToggleList = shallowRef([
  { label: "ctrl + b", value: "ctrl+b" },
  { label: "ctrl + q", value: "ctrl+q" },
])
const chatRightPanelToggleList = shallowRef([
  { label: "ctrl + shift + b", value: "ctrl+shift+b" },
  { label: "ctrl + shift + q", value: "ctrl+shift+q" },
])
const chatDebuggerList = shallowRef([{ label: "ctrl + d", value: "ctrl+d" }])
</script>
<template>
  <Group>
    <ShortcutItem
      :setting-key="SettingKeys.ChatSendShortcut"
      :data-list="sendShortcutList"
      :title="t('chat.settings.sendShortcut')"
      icon-class="i-ic-baseline-send">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.ChatCleanMessage"
      :data-list="cleanMessageList"
      :title="t('chat.cleanMessage')"
      icon-class="i-icon-park-outline-delete">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.ChatCleanContext"
      :data-list="cleanContextList"
      :title="t('chat.cleanContext')"
      icon-class="i-icon-park-outline-clear-format">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.ChatInputSimpleModeShortcut"
      :data-list="simpleModeShortcutList"
      :title="t('chat.settings.inputSimpleShortcut')"
      icon-class="i-ic-twotone-linear-scale">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.ChatNewChat"
      :data-list="newChatList"
      :title="t('chat.settings.newChatShortcut')"
      icon-class="i-ic-outline-playlist-add">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.ChatNewSubChat"
      :data-list="newSubChatList"
      :title="t('chat.settings.newSubChatShortcut')"
      icon-class="i-ic-baseline-account-tree">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.SidebarToggleShortcut"
      :data-list="sidebarToggleList"
      :title="t('chat.settings.toggleSidebarShortcut')"
      icon-class="i-material-symbols-left-panel-close-outline">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.ChatRightPanelToggleShortcut"
      :data-list="chatRightPanelToggleList"
      :title="t('chat.settings.chatRightPanelToggleShortcut')"
      icon-class="i-material-symbols-right-panel-close-outline">
    </ShortcutItem>
    <ShortcutItem
      :setting-key="SettingKeys.ChatDebugger"
      :data-list="chatDebuggerList"
      :title="t('chat.settings.chatDebugger')"
      icon-class="i-ic-round-terminal">
    </ShortcutItem>
  </Group>
</template>
