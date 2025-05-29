<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()
const emit = defineEmits<{
  "update:modelValue": [string]
  change: [string]
  input: [string]
}>()
const { t } = useI18n()
const content = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
})
</script>
<template>
  <div class="chat-input">
    <el-input
      class="textarea"
      input-style="border: none;height: 100%"
      @change="emit('change', $event)"
      @input="emit('input', $event)"
      style="display: flex"
      :autosize="false"
      clearable
      autofocus
      resize="none"
      type="textarea"
      v-model="content"
      :placeholder="t('tip.inputPlaceholder')"></el-input>
  </div>
</template>
<style lang="scss" scoped>
.chat-input {
  .textarea {
    --el-input-border-color: transparent;
    --el-input-hover-border-color: transparent;
    --el-input-focus-border-color: transparent;
    --el-input-bg-color: transparent;
  }
  flex: 1;
  overflow: hidden;
  display: flex;
}
</style>
