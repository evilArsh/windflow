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
      <el-text type="primary" size="large">{{ t("mcp.settings.js.title") }}</el-text>
    </template>
    <div class="flex flex-col gap-0.5rem">
      <ContentBox class="p1rem! gap1rem!">
        <el-text type="primary">{{ t("mcp.settings.js.npmMirror.title") }}</el-text>
        <template #footer>
          <ContentBox class="m0! p0!" normal>
            <el-select v-model="env.npm.registry">
              <el-option v-for="item in env.npm.mirrors" :key="item.value" :label="item.value" :value="item.value">
                <div class="flex items-center">
                  <el-tag class="mr-1rem w-8rem" size="small">
                    {{ item.label }}
                  </el-tag>
                  <span>{{ item.value }}</span>
                </div>
              </el-option>
            </el-select>
            <template #footer>
              <el-text size="small">{{ t("mcp.settings.js.npmMirror.desc") }}</el-text>
            </template>
          </ContentBox>
        </template>
      </ContentBox>
      <ContentBox class="p1rem! gap1rem!">
        <div class="flex gap-1rem">
          <el-text type="primary">{{ t("mcp.settings.js.bun.title") }}</el-text>
          <el-tooltip :content="t(`mcp.settings.js.test`)" placement="top">
            <Button class="m0!" size="small" text @click="done => envStore.checkEnv(done)">
              <i-ic:baseline-terminal class="text-1.4rem"></i-ic:baseline-terminal>
            </Button>
          </el-tooltip>
        </div>
        <template #footer>
          <ContentBox class="m0! p0!" normal>
            <div class="flex flex-col gap1rem flex-1">
              <el-input v-model="env.bun.path" @change="_ => envStore.checkEnv()"></el-input>
              <el-alert
                v-if="env.bun.status"
                :closable="false"
                :title="env.bun.version"
                type="primary"
                :description="t('mcp.settings.js.bun.version')"
                show-icon />
              <el-alert
                v-else
                :closable="false"
                :title="t('mcp.settings.js.bun.lackTitle')"
                type="warning"
                :description="t('mcp.settings.js.bun.lack')"
                show-icon />
            </div>
            <template #footer>
              <el-text size="small">{{ t("mcp.settings.js.bun.desc") }}</el-text>
            </template>
          </ContentBox>
        </template>
      </ContentBox>
    </div>
  </el-card>
</template>
<style lang="scss" scoped></style>
