<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { ChatTopic, SettingKeys } from "@windflow/core/types"
import Group from "../components/group.vue"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const { data: sendShortcut } = settingsStore.dataWatcher<string>(SettingKeys.ChatSendShortcut, null, "enter")
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
  </Group>
</template>
<style lang="scss" scoped>
@use "../components/common.scss";
</style>
