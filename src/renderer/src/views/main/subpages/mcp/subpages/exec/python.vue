<script lang="ts" setup>
import useEnvStore from "@renderer/store/env"
import { storeToRefs } from "pinia"
const envStore = useEnvStore()
const { env } = storeToRefs(envStore)
const { t } = useI18n()
</script>
<template>
  <el-card shadow="never">
    <template #header>
      <el-text type="primary" size="large">{{ t("mcp.settings.python.title") }}</el-text>
    </template>
    <div class="flex flex-col gap-0.5rem">
      <ContentBox class="p1rem! gap1rem!">
        <div class="flex gap-1rem">
          <el-text type="primary">{{ t("mcp.settings.python.uv.title") }}</el-text>
          <el-tooltip :content="t(`mcp.settings.python.uv.test`)" placement="top">
            <Button class="m0!" size="small" text @click="done => envStore.checkEnv(done)">
              <i-ic:baseline-terminal class="text-1.4rem"></i-ic:baseline-terminal>
            </Button>
          </el-tooltip>
        </div>
        <template #footer>
          <ContentBox class="m0! p0!" normal>
            <div class="flex flex-col gap1rem flex-1">
              <el-input v-model="env.uv.path"></el-input>
              <el-alert
                v-if="!env.uv.status"
                :closable="false"
                :title="env.uv.version"
                type="primary"
                :description="t('mcp.settings.python.uv.version')"
                show-icon />
              <el-alert
                v-else
                :closable="false"
                :title="t('mcp.settings.python.uv.lackTitle')"
                type="warning"
                show-icon>
                <ContentBox normal>
                  <div class="flex fle-col gap-1rem">
                    <el-card shadow="never">
                      <template #header>
                        <el-text>{{ t("mcp.settings.python.uv.manualChoose") }}</el-text>
                      </template>
                    </el-card>
                    <el-card shadow="never">
                      <template #header>
                        <el-text>{{ t("mcp.settings.python.uv.onlineDownload") }}</el-text>
                      </template>
                    </el-card>
                  </div>
                  <template #footer>
                    <el-text type="info" size="small">{{ t("mcp.settings.python.uv.lack") }}</el-text>
                  </template>
                </ContentBox>
              </el-alert>
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
