<template>
  <el-popover v-model:visible="toggle" placement="right" trigger="click">
    <template #reference>
      <i-ic:baseline-translate class="text-1.4rem"></i-ic:baseline-translate>
    </template>
    <div class="flex flex-col gap0.2rem">
      <div v-for="i in i18n.availableLocales" :key="i">
        <el-button @click="switchLang(i)" class="w100%">{{ i18n.t(`lang.${i}`) }}</el-button>
      </div>
    </div>
  </el-popover>
</template>
<script lang="ts" setup>
const i18n = useI18n()
const toggle = ref(false)
const switchLang = (lang: string) => {
  i18n.locale.value = lang
  toggle.value = false
}
</script>
