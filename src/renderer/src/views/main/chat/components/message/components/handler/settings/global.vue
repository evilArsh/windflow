<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { ChatTopic, SettingKeys } from "@renderer/types"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const sendShortcut = ref("")
settingsStore.dataWatcher<string>(SettingKeys.ChatSendShortcut, sendShortcut, "enter")
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
  </div>
</template>
<style lang="scss" scoped></style>
