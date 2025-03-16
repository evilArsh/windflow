<script lang="ts" setup>
import useProviderStore from "@renderer/pinia/provider.store"
import { storeToRefs } from "pinia"
const providerStore = useProviderStore()
const { editForm } = storeToRefs(providerStore)
const { t } = useI18n()
</script>
<template>
  <div class="model-setting">
    <el-scrollbar class="w-full">
      <el-form :model="editForm" label-width="auto" class="w-full">
        <el-form-item :label="t('model.apiUrl')" class="w-full">
          <el-input v-model="editForm.apiUrl" />
        </el-form-item>
        <el-form-item :label="t('model.apiKey')" class="w-full">
          <el-input v-model="editForm.apiKey" show-password />
        </el-form-item>
      </el-form>
    </el-scrollbar>
  </div>
</template>
<style lang="scss" scoped>
.model-setting {
  padding: 4rem;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
