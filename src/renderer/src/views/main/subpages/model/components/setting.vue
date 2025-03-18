<script lang="ts" setup>
import useProviderStore from "@renderer/pinia/provider.store"
import { storeToRefs } from "pinia"
const providerStore = useProviderStore()
const { editProvider } = storeToRefs(providerStore)
const { t } = useI18n()
</script>
<template>
  <ContentLayout handler-height="0">
    <template #content>
      <MsgBubble>
        <template #head>
          <el-avatar :src="editProvider.logo" size="default" />
        </template>
        <template #content>
          <ContentLayout handler-height="0">
            <template #header>
              <el-text type="primary">{{ editProvider.name }}</el-text>
            </template>
            <template #content>
              <div class="model-setting">
                <el-scrollbar class="w-full">
                  <el-form :model="editProvider" label-width="10rem" class="w-full">
                    <el-form-item :label="t('model.apiUrl')" class="w-full">
                      <el-input v-model="editProvider.apiUrl" />
                    </el-form-item>
                    <el-form-item :label="t('model.apiKey')" class="w-full">
                      <el-input v-model="editProvider.apiKey" show-password />
                    </el-form-item>
                  </el-form>
                </el-scrollbar>
              </div>
            </template>
          </ContentLayout>
        </template>
      </MsgBubble>
    </template>
  </ContentLayout>
</template>
<style lang="scss" scoped>
.model-setting {
  --model-setting-padding: 1rem;
  --model-setting-bg-color: rgb(235, 235, 235);

  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--model-setting-bg-color);
  padding: var(--model-setting-padding);
  border-radius: 1rem;
}
</style>
