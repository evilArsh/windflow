<script lang="ts" setup>
import { ChatTopic } from "@windflow/core/types"
import Global from "./global.vue"
import Message from "./message.vue"
import Shell from "../components/shell.vue"
import Group from "../components/group.vue"
defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
</script>
<template>
  <Shell>
    <template #reference>
      <ContentBox background>
        <i-ic-outline-settings class="text-1.6rem" />
      </ContentBox>
    </template>
    <template #header>
      <el-text>{{ t("chat.settings.label") }}</el-text>
    </template>
    <template #default>
      <div class="w-full h-40rem">
        <Group>
          <ContentBox normal>
            <el-text type="primary">{{ t("chat.settings.messageLabel") }}</el-text>
            <template #footer>
              <Message :topic></Message>
            </template>
          </ContentBox>
          <ContentBox normal>
            <el-text type="primary">{{ t("chat.settings.inputLabel") }}</el-text>
            <template #footer>
              <Global :topic></Global>
            </template>
          </ContentBox>
        </Group>
      </div>
    </template>
  </Shell>
</template>
<style lang="scss" scoped></style>
