<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp"
import { storeToRefs } from "pinia"
const mcp = useMcpStore()
const { env } = storeToRefs(mcp)

const { t } = useI18n()
</script>
<template>
  <el-card shadow="never">
    <template #header>
      <el-text type="primary" size="large">{{ t("mcp.settings.node.title") }}</el-text>
    </template>
    <div class="flex flex-col gap-0.5rem">
      <ContentBox class="p1rem!">
        <el-text type="primary">{{ t("mcp.settings.node.npmMirror.title") }}</el-text>
        <template #footer>
          <ContentBox normal>
            <el-select v-model="env.npm.registry">
              <el-option v-for="item in env.npm.mirrors" :key="item.value" :label="item.value" :value="item.value">
                <div class="flex items-center">
                  <el-tag class="mr-1rem w-5rem" size="small">
                    {{ item.label }}
                  </el-tag>
                  <span>{{ item.value }}</span>
                </div>
              </el-option>
            </el-select>
            <template #footer>
              <el-text size="small">{{ t("mcp.settings.node.npmMirror.desc") }}</el-text>
            </template>
          </ContentBox>
        </template>
      </ContentBox>
    </div>
  </el-card>
</template>
<style lang="scss" scoped></style>
