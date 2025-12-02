<script lang="ts" setup>
import useEnvStore from "@renderer/store/env"
import { storeToRefs } from "pinia"
import { onFileChoose } from "../utils"
import { CallBackFn } from "@toolmain/shared"
import { DialogPanel } from "@toolmain/components"
const envStore = useEnvStore()
const { env } = storeToRefs(envStore)
const { t } = useI18n()
const doc = ref(`
## macOS or Linux
### curl
\`\`\`shell
curl -fsSL https://bun.sh/install | bash
\`\`\`
## Windows
\`\`\`shell
powershell -c "irm bun.sh/install.ps1 | iex"
\`\`\`
> Changing the [execution policy](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies?view=powershell-7.4#powershell-execution-policies) allows running a script from the internet.
## Github
\`\`\`shell
https://github.com/oven-sh/bun/releases
\`\`\`
`)
function chooseFile(done: CallBackFn) {
  onFileChoose(done, (path: string) => {
    env.value.bun.path = path
    envStore.checkEnv()
  })
}
</script>
<template>
  <DialogPanel>
    <template #header>
      <el-text type="primary" size="large">{{ t("mcp.settings.js.title") }}</el-text>
    </template>
    <div class="flex flex-col gap-2rem">
      <ContentBox class="p1rem! gap1rem!" normal>
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
      <ContentBox class="p1rem! gap1rem!" normal>
        <div class="flex gap-1rem">
          <el-text type="primary">{{ t("mcp.settings.js.bun.title") }}</el-text>
          <Button class="m0!" size="small" @click="done => envStore.checkEnv(done)">
            <i-ic-baseline-terminal class="text-1.4rem"></i-ic-baseline-terminal>
            <span>{{ t(`mcp.settings.js.test`) }}</span>
          </Button>
          <Button size="small" @click="chooseFile">
            <i-ep-document class="text-1.4rem"></i-ep-document>
            <span>{{ t("btn.chooseFile") }}</span>
          </Button>
        </div>
        <template #footer>
          <ContentBox class="m0! p0!" normal>
            <div class="flex flex-col gap1rem flex-1">
              <el-input v-model="env.bun.path" readonly @change="_ => envStore.checkEnv()"></el-input>
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
                show-icon>
                <ContentBox normal>
                  <div class="flex flex-col gap-1rem flex-1">
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
              <el-text size="small">{{ t("mcp.settings.js.bun.desc") }}</el-text>
            </template>
          </ContentBox>
        </template>
      </ContentBox>
    </div>
  </DialogPanel>
</template>
<style lang="scss" scoped>
:deep(.el-alert__content) {
  flex: 1;
}
</style>
