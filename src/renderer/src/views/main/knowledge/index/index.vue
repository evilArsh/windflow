<script lang="ts" setup>
import useKnowledgeStore from "@renderer/store/knowledge"
import useRagFilesStore from "@renderer/store/ragFiles"
import { storeToRefs } from "pinia"
// import { useDialog } from "@toolmain/shared"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { Knowledge } from "@renderer/types/knowledge"
import { CallBackFn, errorToText, msgError, uniqueId } from "@toolmain/shared"
// import { Spinner } from "@toolmain/components"
const knowledge = useKnowledgeStore()
const ragFiles = useRagFilesStore()
const { knowledges } = storeToRefs(knowledge)
const { t } = useI18n()
// const { props, event, close, open } = useDialog({
//   width: "70vw",
// })
const current = ref<Knowledge>()
const search = shallowReactive({
  keyword: "",
})
const filterKnowledges = computed(() => knowledges.value.filter(v => v.name.includes(search.keyword)))
const ev = {
  async onNew(done: CallBackFn) {
    try {
      const newData: Knowledge = {
        id: uniqueId(),
        name: t("knowledge.newDefault"),
        type: "rag",
      }
      await knowledge.api.add(newData)
      knowledges.value.push(newData)
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
}
</script>
<template>
  <ContentLayout custom>
    <!-- <template #header> </template> -->
    <div class="flex flex-1 gap.5rem overflow-hidden">
      <div class="knowledge-list">
        <div class="knowledge-list-header">
          <el-input v-model="search.keyword" :placeholder="t('knowledge.search')" clearable />
          <Button type="primary" @click="ev.onNew">{{ t("btn.new") }}</Button>
        </div>
        <div class="knowledge-list-content">
          <el-scrollbar>
            <div class="flex flex-col gap-[var(--ai-gap-base)]">
              <ContentBox
                v-for="kb in filterKnowledges"
                :key="kb.id"
                background
                :default-lock="current?.id === kb.id"
                still-lock>
                <template #icon>
                  <i-material-symbols-light:book-2 class="text-1.4rem" />
                </template>
                <el-text>{{ kb.name }}</el-text>
              </ContentBox>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <div class="flex-1">
        <el-empty></el-empty>
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
