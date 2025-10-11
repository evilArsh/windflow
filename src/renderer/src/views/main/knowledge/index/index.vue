<script lang="ts" setup>
import useMcpStore from "@renderer/store/mcp"
import { MCPClientStatus, MCPServerParam } from "@shared/types/mcp"
import { storeToRefs } from "pinia"
import { useDialog } from "@toolmain/shared"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { Spinner } from "@toolmain/components"
const mcp = useMcpStore()
const { servers } = storeToRefs(mcp)
const { t } = useI18n()
const { props, event, close, open } = useDialog({
  width: "70vw",
})
const current = ref<MCPServerParam>()
const search = shallowReactive({
  keyword: "",
})
const filterServers = computed(() =>
  servers.value.filter(
    v =>
      (v.name.includes(search.keyword) ||
        v.params.command.includes(search.keyword) ||
        v.params.url.includes(search.keyword)) &&
      !v.modifyTopic
  )
)
</script>
<template>
  <ContentLayout custom>
    <!-- <template #header> </template> -->
    <div class="flex flex-1 gap.5rem overflow-hidden">
      <div class="knowledge-list">
        <div class="knowledge-list-header">
          <el-input v-model="search.keyword" :placeholder="t('knowledge.search')" clearable />
          <el-button type="primary" @click="open">{{ t("btn.new") }}</el-button>
        </div>
        <div class="knowledge-list-content">
          <el-scrollbar>
            <div class="flex flex-col gap-[var(--ai-gap-base)]">
              <ContentBox
                v-for="server in filterServers"
                :key="server.id"
                background
                :default-lock="current?.id === server.id"
                still-lock>
                <template #icon>
                  <i-material-symbols-light:book-2 class="text-1.4rem" />
                </template>
                <McpName :data="server"></McpName>
                <Spinner
                  :model-value="server.status === MCPClientStatus.Connecting"
                  class="flex-shrink-0 text-1.2rem"></Spinner>
              </ContentBox>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <div class="flex-1">
        <el-empty></el-empty>
      </div>
    </div>
    <el-dialog v-bind="props" v-on="event"> </el-dialog>
  </ContentLayout>
</template>
<style lang="scss" scoped>
.knowledge-list {
  border-right: solid 1px;
  border-color: var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: var(--ai-gap-medium);
  width: 30rem;
  gap: var(--ai-gap-medium);
  .knowledge-list-header {
    flex-shrink: 0;
    display: flex;
    gap: var(--ai-gap-base);
  }
  .knowledge-list-content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
