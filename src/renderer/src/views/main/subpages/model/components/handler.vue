<script lang="ts" setup>
import useProviderStore from "@renderer/store/provider"
const providerStore = useProviderStore()
const { t } = useI18n()
function onReset() {
  providerStore.api.reset()
}
</script>
<template>
  <div class="flex flex-wrap gap-0.5rem">
    <el-popconfirm :title="t('tip.reset')" @confirm="onReset">
      <template #reference>
        <el-button size="small" type="primary" plain>
          <i-ep:refresh></i-ep:refresh>
        </el-button>
      </template>
      <template #actions="{ confirm, cancel }">
        <div class="flex justify-between">
          <el-button type="danger" size="small" @click="confirm">{{ t("tip.yes") }}</el-button>
          <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
        </div>
      </template>
    </el-popconfirm>
  </div>
</template>
