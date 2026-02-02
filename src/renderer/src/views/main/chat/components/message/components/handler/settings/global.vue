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
const simpleModeShortcutList = shallowRef([
  { label: "ctrl + ↓", value: "ctrl+arrowDown" },
  //
])

const { data: sendShortcut } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatSendShortcut,
  null,
  sendShortcutList.value[0].value
)
const { data: simpleModeShortcut } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatInputSimpleModeShortcut,
  null,
  simpleModeShortcutList.value[0].value
)
</script>
<template>
  <Group>
    <Item :title="t('chat.settings.sendShortcut')" icon-class="i-ic-baseline-send">
      <el-select v-model="sendShortcut" :teleported="false">
        <el-option v-for="item in sendShortcutList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.settings.inputSimpleShortcut')" icon-class="i-material-symbols-line-start-rounded">
      <el-select v-model="simpleModeShortcut" :teleported="false">
        <el-option v-for="item in simpleModeShortcutList" :key="item.value" :label="item.label" :value="item.value">
          {{ item.label }}
        </el-option>
      </el-select>
    </Item>
  </Group>
</template>
