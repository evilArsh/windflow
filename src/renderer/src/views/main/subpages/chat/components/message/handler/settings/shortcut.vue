<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { ChatTopic, SettingKeys } from "@renderer/types"
defineProps<{
  topic: ChatTopic
}>()
const sendShortcut = ref("")
const settingsStore = useSettingsStore()
settingsStore.api.dataWatcher<string>(SettingKeys.ChatSendShortcut, sendShortcut, "enter")
</script>
<template>
  <ContentBox>
    <el-text>聊天快捷键</el-text>
    <template #footer>
      <el-select v-model="sendShortcut" size="small" :teleported="false">
        <el-option v-for="item in ['enter', 'ctrl+enter', 'shift+enter']" :key="item" :value="item">
          {{ item }}
        </el-option>
      </el-select>
    </template>
  </ContentBox>
</template>
<style lang="scss" scoped></style>
