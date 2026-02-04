<script setup lang="ts">
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@windflow/core/types"
import Item from "./item.vue"
const props = defineProps<{
  title: string
  iconClass: string
  dataList: Array<{
    label: string
    value: string
  }>
  settingKey: SettingKeys
}>()
const settingsStore = useSettingsStore()

const { data } = settingsStore.dataWatcher<string>(props.settingKey, null, props.dataList[0].value)
</script>
<template>
  <Item :title :icon-class>
    <el-select class="w-20rem!" v-model="data" :teleported="false">
      <el-option v-for="item in dataList" :key="item.value" :label="item.label" :value="item.value">
        {{ item.label }}
      </el-option>
    </el-select>
  </Item>
</template>
<style lang="scss" scoped></style>
