<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { ChatTopic, SettingKeys } from "@windflow/core/types"
import Group from "../components/group.vue"
import Item from "../components/item.vue"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const settingsStore = useSettingsStore()

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

const { data: sendShortcut } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatSendShortcut,
  null,
  sendShortcutList.value[0].value
)
const { data: cleanMessage } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatCleanMessage,
  null,
  cleanMessageList.value[0].value
)
const { data: cleanContext } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatCleanContext,
  null,
  cleanContextList.value[0].value
)
const { data: simpleModeShortcut } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatInputSimpleModeShortcut,
  null,
  simpleModeShortcutList.value[0].value
)
const { data: newChat } = settingsStore.dataWatcher<string>(SettingKeys.ChatNewChat, null, newChatList.value[0].value)
const { data: newSubChat } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatNewSubChat,
  null,
  newSubChatList.value[0].value
)
const { data: sidebarToggle } = settingsStore.dataWatcher<string>(
  SettingKeys.SidebarToggleShortcut,
  null,
  sidebarToggleList.value[0].value
)
const { data: chatRightSidebarToggle } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatRightPanelToggleShortcut,
  null,
  chatRightPanelToggleList.value[0].value
)
</script>
<template>
  <Group>
    <Item :title="t('chat.settings.sendShortcut')" icon-class="i-ic-baseline-send">
      <el-select class="w-20rem!" v-model="sendShortcut" :teleported="false">
        <el-option v-for="item in sendShortcutList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.cleanMessage')" icon-class="i-icon-park-outline-delete">
      <el-select class="w-20rem!" v-model="cleanMessage" :teleported="false">
        <el-option v-for="item in cleanMessageList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.cleanContext')" icon-class="i-icon-park-outline-clear-format">
      <el-select class="w-20rem!" v-model="cleanContext" :teleported="false">
        <el-option v-for="item in cleanContextList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.settings.inputSimpleShortcut')" icon-class="i-ic-twotone-linear-scale">
      <el-select class="w-20rem!" v-model="simpleModeShortcut" :teleported="false">
        <el-option v-for="item in simpleModeShortcutList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.settings.newChatShortcut')" icon-class="i-ic-outline-playlist-add">
      <el-select class="w-20rem!" v-model="newChat" :teleported="false">
        <el-option v-for="item in newChatList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.settings.newSubChatShortcut')" icon-class="i-ic-baseline-account-tree">
      <el-select class="w-20rem!" v-model="newSubChat" :teleported="false">
        <el-option v-for="item in newSubChatList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.settings.toggleSidebarShortcut')" icon-class="i-material-symbols-right-panel-close-outline">
      <el-select class="w-20rem!" v-model="sidebarToggle" :teleported="false">
        <el-option v-for="item in sidebarToggleList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item
      :title="t('chat.settings.chatRightPanelToggleShortcut')"
      icon-class="i-material-symbols-left-panel-close-outline">
      <el-select class="w-20rem!" v-model="chatRightSidebarToggle" :teleported="false">
        <el-option v-for="item in chatRightPanelToggleList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
  </Group>
</template>
