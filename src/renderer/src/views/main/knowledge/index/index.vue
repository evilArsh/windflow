<script lang="ts" setup>
import useKnowledgeStore from "@renderer/store/knowledge"
import useRagFilesStore from "@renderer/store/ragFiles"
import RagFile from "../components/ragFile.vue"
import { storeToRefs } from "pinia"
// import { useDialog } from "@toolmain/shared"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { Knowledge } from "@renderer/types/knowledge"
import { CallBackFn, errorToText, msgError, uniqueId } from "@toolmain/shared"
import { RAGLocalFileMeta } from "@shared/types/rag"
// import { Spinner } from "@toolmain/components"
const useKnowledge = useKnowledgeStore()
const useRagFiles = useRagFilesStore()
const { knowledges } = storeToRefs(useKnowledge)
const { ragFiles } = storeToRefs(useRagFiles)
const { t } = useI18n()
// const { props, event, close, open } = useDialog({
//   width: "70vw",
// })
const cache = reactive({
  keyword: "",
  current: null as Knowledge | null,
  currentFiles: [] as RAGLocalFileMeta[],
})
const filterKnowledges = computed(() => knowledges.value.filter(v => v.name.includes(cache.keyword)))
const ev = {
  async onAddNewKnowledge(done: CallBackFn) {
    try {
      const newData: Knowledge = {
        id: uniqueId(),
        name: t("knowledge.newDefault"),
        type: "rag",
      }
      await useKnowledge.api.add(newData)
      knowledges.value.push(newData)
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
  async onKnowledgeChoose(kb: Knowledge) {
    try {
      cache.current = kb
      if (Object.hasOwn(ragFiles, kb.id)) {
        cache.currentFiles = ragFiles[kb.id]
      } else {
        cache.currentFiles.length = 0
      }
    } catch (error) {
      msgError(errorToText(error))
    }
  },
}
</script>
<template>
  <ContentLayout custom>
    <template #header>
      <div class="p-1rem flex-1 flex flex-col">
        <div class="flex items-center">
          <Button type="primary" size="small" @click="ev.onAddNewKnowledge">{{ t("btn.new") }}</Button>
        </div>
      </div>
    </template>
    <div class="flex flex-1 gap.5rem overflow-hidden">
      <div class="knowledge-list">
        <div class="knowledge-list-header">
          <el-input v-model="cache.keyword" :placeholder="t('knowledge.search')" clearable />
        </div>
        <div class="knowledge-list-content">
          <el-scrollbar>
            <div class="flex flex-col gap-[var(--ai-gap-base)]">
              <ContentBox
                v-for="kb in filterKnowledges"
                :key="kb.id"
                background
                :default-lock="cache.current?.id === kb.id"
                still-lock
                @click="ev.onKnowledgeChoose(kb)">
                <template #icon>
                  <i-material-symbols-light:book-2 class="text-1.4rem" />
                </template>
                <el-text>{{ kb.name }}</el-text>
              </ContentBox>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <div class="flex-1 flex">
        <RagFile v-if="cache.current" :file-list="cache.currentFiles"></RagFile>
      </div>
    </div>
    <!-- <el-dialog v-bind="props" v-on="event"> </el-dialog> -->
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
