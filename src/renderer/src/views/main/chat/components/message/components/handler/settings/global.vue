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
</script>
<template>
  <Group>
    <Item :title="t('chat.settings.shortcut')" icon-class="i-ic-baseline-send">
      <el-select v-model="sendShortcut" :teleported="false">
        <el-option v-for="item in ['enter', 'ctrl+enter', 'shift+enter']" :key="item" :value="item">
          {{ item }}
        </el-option>
      </el-select>
    </Item>
  </Group>
</template>
