<script lang="ts" setup>
const props = defineProps<{
  modelValue: Array<string | number>
}>()
const data = computed(() => props.modelValue)
function onAdd(index: number) {
  data.value.splice(index + 1, 0, "")
}
function onDel(index: number) {
  data.value.splice(index, 1)
}
</script>
<template>
  <el-row class="flex-1">
    <el-col>
      <div class="flex flex-col gap-.5rem">
        <el-input :model-value="data.join(' ')" autosize readonly type="textarea"></el-input>
        <el-card shadow="never" style="--el-card--padding: 0.5rem">
          <el-button v-if="data.length == 0" size="small" type="primary" @click="onAdd(-1)">
            <i-ep:plus></i-ep:plus>
          </el-button>
          <div v-else class="flex flex-col gap-.5rem">
            <ContentBox v-for="(_, index) in data" :key="index">
              <el-input type="textarea" autosize :maxlength="500" v-model.trim="data[index]"></el-input>
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
