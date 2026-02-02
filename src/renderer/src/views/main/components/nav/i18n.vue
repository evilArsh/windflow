<template>
  <el-popover v-model:visible="toggle" placement="right" trigger="click">
    <template #reference>
      <ContentBox>
        <i-ic-baseline-translate class="text-1.4rem"></i-ic-baseline-translate>
      </ContentBox>
    </template>
    <div class="flex flex-col gap0.2rem">
      <div v-for="i in i18n.availableLocales" :key="i">
        <el-button @click="switchLang(i)" class="w100%">{{ i18n.t(`lang.${i}`) }}</el-button>
      </div>
    </div>
  </el-popover>
</template>
<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@windflow/core/types"
const settingsStore = useSettingsStore()
const i18n = useI18n()
const toggle = ref(false)
const switchLang = (lang: string) => {
  i18n.locale.value = lang
  window.defaultLanguage = i18n.t(`lang.${lang}`)
  window.defaultTopicTitle = i18n.t("chat.addChat")
  toggle.value = false
}
window.defaultLanguage = i18n.t(`lang.${i18n.locale.value}`)
window.defaultTopicTitle = i18n.t("chat.addChat")
settingsStore.dataWatcher<string>(SettingKeys.Language, i18n.locale, i18n.locale.value, switchLang)
</script>
