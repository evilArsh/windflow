<script lang="ts" setup>
import { Provider } from "@renderer/types"
const { t } = useI18n()
const props = defineProps<{
  modelValue: Provider
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: Provider): void
}>()
const data = computed({
  get() {
    return props.modelValue
  },
  set(value: Provider) {
    emit("update:modelValue", value)
  },
})
</script>
<template>
  <MsgBubble>
    <template #head>
      <el-avatar :src="data.logo" size="default" />
    </template>
    <template #content>
      <ContentLayout>
        <template #header>
          <div class="flex items-center">
            <el-text type="primary" :id="data.id">{{ data.name }}</el-text>
          </div>
        </template>
        <template #content>
          <div class="model-setting">
            <el-scrollbar class="w-full">
              <el-form :model="data" label-width="10rem" class="w-full">
                <el-form-item :label="t('model.apiUrl')" class="w-full">
                  <el-input v-model="data.apiUrl" />
                </el-form-item>
                <el-form-item :label="t('model.apiKey')" class="w-full">
                  <el-input v-model="data.apiKey" show-password />
                </el-form-item>
              </el-form>
            </el-scrollbar>
          </div>
        </template>
      </ContentLayout>
    </template>
  </MsgBubble>
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
