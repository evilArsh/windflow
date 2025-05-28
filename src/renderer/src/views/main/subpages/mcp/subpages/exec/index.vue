<script lang="ts" setup>
const { t } = useI18n()
const npmMirrors = ref([
  { label: "taobao", value: "https://registry.npmmirror.com" },
  { label: "npm", value: "https://registry.npmjs.org" },
])
const settings = reactive({
  npmMirror: "https://registry.npmmirror.com",
})
</script>
<template>
  <ContentLayout>
    <div class="mx-auto my-1rem max-w-1024px flex flex-col gap1rem">
      <ContentBox class="p1rem!">
        <div class="flex-1">
          <el-text type="primary" size="large">{{ t("mcp.settings.npmMirror") }}</el-text>
        </div>
        <template #end>
          <el-select v-model="settings.npmMirror" class="w-35rem!">
            <el-option
              v-for="item in npmMirrors"
              :key="item.value"
              v-model="settings.npmMirror"
              :label="item.value"
              :value="item.value">
              <div class="flex items-center">
                <el-tag class="mr-1rem w-5rem" size="small">
                  {{ item.label }}
                </el-tag>
                <span>{{ item.value }}</span>
              </div>
            </el-option>
          </el-select>
        </template>
        <template #footer>
          <el-text size="small">啊实打实的</el-text>
        </template>
      </ContentBox>
    </div>
  </ContentLayout>
</template>
<style lang="scss" scoped></style>
