<script lang="ts" setup>
import useEnvStore from "@renderer/store/env"
import { storeToRefs } from "pinia"
import { onFileChoose } from "../utils"
import { CallBackFn } from "@toolmain/shared"

const envStore = useEnvStore()
const { env } = storeToRefs(envStore)
const { t } = useI18n()

const doc = ref(`
## macOS or Linux
### curl
\`\`\`shell
curl -LsSf https://astral.sh/uv/install.sh | sh
\`\`\`
### wget
\`\`\`shell
wget -qO- https://astral.sh/uv/install.sh | sh
\`\`\`
## Windows
\`\`\`shell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
\`\`\`
> Changing the [execution policy](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies?view=powershell-7.4#powershell-execution-policies) allows running a script from the internet.
## Github
\`\`\`shell
https://github.com/astral-sh/uv/releases
\`\`\`
`)

function chooseFile(done: CallBackFn) {
  onFileChoose(done, (path: string) => {
    env.value.uv.path = path
    envStore.checkEnv()
  })
}
</script>
<template>
  <el-card shadow="never">
    <template #header>
      <el-text type="primary" size="large">{{ t("mcp.settings.python.title") }}</el-text>
    </template>
    <div class="flex flex-col gap-0.5rem">
      <ContentBox class="p1rem! gap1rem!">
        <el-text type="primary">{{ t("mcp.settings.python.mirror.title") }}</el-text>
        <template #footer>
          <ContentBox class="m0! p0!" normal>
            <el-select v-model="env.python.registry">
              <el-option v-for="item in env.python.mirrors" :key="item.value" :label="item.value" :value="item.value">
                <div class="flex items-center">
                  <el-tag class="mr-1rem w-8rem" size="small">
                    {{ item.label }}
                  </el-tag>
                  <span>{{ item.value }}</span>
                </div>
              </el-option>
            </el-select>
            <template #footer>
              <el-text size="small">{{ t("mcp.settings.python.mirror.desc") }}</el-text>
            </template>
          </ContentBox>
        </template>
      </ContentBox>
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
              <el-input readonly v-model="env.uv.path" @change="_ => envStore.checkEnv()"></el-input>
              <el-alert
                v-if="env.uv.status"
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
                  <div class="flex flex-col gap-1rem flex-1">
                    <el-card style="--el-card-padding: 1rem" class="flex-1" shadow="never">
                      <template #header>
                        <el-text>{{ t("mcp.settings.python.uv.manualChoose") }}</el-text>
                      </template>
                      <Button size="small" @click="chooseFile">{{ t("btn.chooseFile") }}</Button>
                    </el-card>
                    <el-card style="--el-card-padding: 1rem" class="flex-1" shadow="never">
                      <template #header>
                        <el-text>{{ t("mcp.settings.python.uv.onlineDownload") }}</el-text>
                      </template>
                      <Markdown v-model="doc"></Markdown>
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
<style lang="scss" scoped>
:deep(.el-alert__content) {
  flex: 1;
}
</style>
