<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { ChatTopic, SettingKeys } from "@windflow/core/types"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const sendShortcut = ref("")
const forcePlaintext = ref(false)
settingsStore.dataWatcher<string>(SettingKeys.ChatSendShortcut, sendShortcut, "enter")
settingsStore.dataWatcher<boolean>(SettingKeys.ChatForcePlaintext, forcePlaintext, false)
</script>
<template>
  <div class="flex flex-col w-full">
    <el-divider class="my-.25rem!"></el-divider>
    <ContentBox>
      <el-text>{{ t("chat.settings.shortcut") }}</el-text>
      <template #footer>
        <el-select v-model="sendShortcut" size="small" :teleported="false">
          <el-option v-for="item in ['enter', 'ctrl+enter', 'shift+enter']" :key="item" :value="item">
            {{ item }}
          </el-option>
        </el-select>
      </template>
    </ContentBox>
    <el-divider class="my-.25rem!"></el-divider>
    <ContentBox>
      <el-text>{{ t("chat.settings.forcePlaintext") }}</el-text>
      <template #footer>
        <el-switch v-model="forcePlaintext"></el-switch>
      </template>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped></style>
