<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@renderer/types"
const sendShortcut = ref("")
const settingsStore = useSettingsStore()
settingsStore.api.dataWatcher<string>(SettingKeys.ChatSendShortcut, sendShortcut, "enter")
</script>
<template>
  <ContentBox>
    <el-text>聊天快捷键</el-text>
    <template #footer>
      <div class="flex gap1rem">
        <el-select v-model="sendShortcut" size="small">
          <el-option v-for="item in ['enter', 'ctrl+enter', 'shift+enter']" :key="item" :value="item">
            {{ item }}
          </el-option>
        </el-select>
      </div>
    </template>
  </ContentBox>
</template>
<style lang="scss" scoped></style>
