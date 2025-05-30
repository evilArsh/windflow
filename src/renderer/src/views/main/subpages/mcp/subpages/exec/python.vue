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
      <el-text type="primary" size="large">{{ t("mcp.settings.python.title") }}</el-text>
    </template>
    <div class="flex flex-col gap-0.5rem">
      <ContentBox class="p1rem!">
        <el-text type="primary" size="large">{{ t("mcp.settings.python.uv.title") }}</el-text>
        <template #footer>
          <ContentBox normal>
            <div class="flex flex-col gap.5rem flex-1">
              <el-input v-model="env.python.uvPath"></el-input>
              <div class="flex gap-0.5rem">
                <el-button>
                  <el-text>{{ t("mcp.settings.python.uv.autoScan") }}</el-text>
                </el-button>
                <el-button>
                  <el-text>{{ t("mcp.settings.python.uv.manualChoose") }}</el-text>
                </el-button>
                <el-button>
                  <el-text>{{ t("mcp.settings.python.uv.onlineDownload") }}</el-text>
                </el-button>
              </div>
            </div>
            <template #footer>
              <el-text size="small">{{ t("mcp.settings.python.uv.desc") }}</el-text>
            </template>
          </ContentBox>
        </template>
      </ContentBox>
    </div>
  </el-card>
</template>
<style lang="scss" scoped></style>
