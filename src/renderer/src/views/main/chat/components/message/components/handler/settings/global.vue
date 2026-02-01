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

const { data: sendShortcut } = settingsStore.dataWatcher<string>(SettingKeys.ChatSendShortcut, null, "enter")
const { data: simpleModeShortcut } = settingsStore.dataWatcher<string>(
  SettingKeys.ChatInputSimpleModeShortcut,
  null,
  "ctrl+ArrowDown"
)
</script>
<template>
  <Group>
    <Item :title="t('chat.settings.sendShortcut')" icon-class="i-ic-baseline-send">
      <el-select v-model="sendShortcut" :teleported="false">
        <el-option v-for="item in ['enter', 'ctrl+enter', 'shift+enter']" :key="item" :value="item">
          {{ item }}
        </el-option>
      </el-select>
    </Item>
    <Item :title="t('chat.settings.inputSimpleShortcut')" icon-class="i-material-symbols-line-start-rounded">
      <el-select v-model="simpleModeShortcut" :teleported="false">
        <el-option v-for="item in ['ctrl+arrowDown']" :key="item" :value="item">
          {{ item }}
        </el-option>
      </el-select>
    </Item>
  </Group>
</template>
