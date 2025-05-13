<script lang="ts" setup>
const props = defineProps<{
  modelValue?: Record<string, string | number>
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value?: Record<string, string | number>): void
}>()
const data = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
const dataset = ref<{ key: string; value: string | number }[]>([])
watchEffect(() => {
  if (!data.value) return
  dataset.value = Object.entries(data.value).map(([key, value]) => ({ key, value }))
})
function onAdd(index: number) {
  dataset.value.splice(index + 1, 0, {
    key: `key_${dataset.value.length}`,
    value: "value",
  })
  onChange()
}
function onDel(index: number) {
  dataset.value.splice(index, 1)
  onChange()
}
function onChange() {
  emit(
    "update:modelValue",
    dataset.value.reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value }), {})
  )
}
</script>
<template>
  <el-row class="flex-1">
    <el-col>
      <div class="flex flex-col gap-.5rem">
        <el-card shadow="never" style="--el-card--padding: 0.5rem">
          <el-button v-if="dataset.length == 0" size="small" type="primary" @click="onAdd(-1)">
            <i-ep:plus></i-ep:plus>
          </el-button>
          <div v-else class="flex flex-col gap-.5rem">
            <ContentBox v-for="(item, index) in dataset" :key="item.key">
              <el-row class="flex-1" :gutter="5">
                <el-col :span="12">
                  <el-input
                    type="textarea"
                    autosize
                    :maxlength="500"
                    @change="onChange"
                    v-model="dataset[index].key"></el-input>
                </el-col>
                <el-col :span="12">
                  <el-input
                    type="textarea"
                    autosize
                    :maxlength="500"
                    @change="onChange"
                    v-model="dataset[index].value"></el-input>
                </el-col>
              </el-row>
              <template #end>
                <div class="flex gap-.25rem">
                  <el-button size="small" type="primary" @click="onAdd(index)">
                    <i-ep:plus></i-ep:plus>
                  </el-button>
                  <el-button size="small" type="danger" @click="onDel(index)">
                    <i-ep:delete></i-ep:delete>
                  </el-button>
                </div>
              </template>
            </ContentBox>
          </div>
        </el-card>
      </div>
    </el-col>
  </el-row>
</template>
