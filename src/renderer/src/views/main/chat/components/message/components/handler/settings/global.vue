<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { ChatTopic, SettingKeys } from "@windflow/core/types"
import Group from "../components/group.vue"
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
  <Group>
    <ContentBox class="setting-box">
      <template #icon>
        <i-ic-baseline-send></i-ic-baseline-send>
      </template>
      <el-text size="small">{{ t("chat.settings.shortcut") }}</el-text>
      <template #footer>
        <el-select v-model="sendShortcut" size="small" :teleported="false">
          <el-option v-for="item in ['enter', 'ctrl+enter', 'shift+enter']" :key="item" :value="item">
            {{ item }}
          </el-option>
        </el-select>
      </template>
    </ContentBox>
    <ContentBox class="setting-box">
      <template #icon>
        <i-ic-baseline-auto-fix-high></i-ic-baseline-auto-fix-high>
      </template>
      <el-text size="small">{{ t("chat.settings.forcePlaintext") }}</el-text>
      <template #footer>
        <el-switch v-model="forcePlaintext"></el-switch>
      </template>
    </ContentBox>
  </Group>
</template>
<style lang="scss" scoped>
@use "../components/common.scss";
</style>
