<script setup lang="ts">
import ModelList from "./list.vue"
const props = defineProps<{
  modelValue: string[]
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void
}>()
const data = computed({
  get() {
    return props.modelValue
  },
  set(val: string[]) {
    emit("update:modelValue", val)
  },
})

const pop = reactive({
  show: false,
  toggle: markRaw(() => {
    pop.show = !pop.show
  }),
})
</script>
<template>
  <div>
    <el-popover placement="top" :width="400" trigger="click" v-model:visible="pop.show">
      <template #reference>
        <el-badge :value="data.length" type="primary">
          <el-button size="small">
            <template #icon>
              <i-mdi:gift-open v-if="pop.show"></i-mdi:gift-open>
              <i-mdi:gift v-else></i-mdi:gift>
            </template>
            <el-text>模型</el-text>
          </el-button>
        </el-badge>
      </template>
      <template #default>
        <ModelList v-model="data" />
      </template>
    </el-popover>
  </div>
</template>
<style lang="scss" scoped></style>
