<script lang="ts" setup>
// import useKnowledgeStore from "@renderer/store/knowledge"
// import useRagFilesStore from "@renderer/store/ragFiles"
import useSettingsStore from "@renderer/store/settings"
import useEmbeddingStore from "@renderer/store/embedding"
import { storeToRefs } from "pinia"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
// import { Knowledge } from "@renderer/types/knowledge"
import { cloneDeep, useDialog, CallBackFn, errorToText, msgError, uniqueId } from "@toolmain/shared"
import { SettingKeys } from "@renderer/types"
import EmbeddingForm from "./components/form.vue"
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { FormItemRule } from "element-plus"
import { Arrayable } from "@vueuse/core"

// const knowledgeStore = useKnowledgeStore()
// const ragFilesStore = useRagFilesStore()
const settingsStore = useSettingsStore()
const embeddingStore = useEmbeddingStore()
// const { knowledges } = storeToRefs(knowledgeStore)
// const { ragFiles } = storeToRefs(ragFilesStore)
const { embeddings } = storeToRefs(embeddingStore)
const formRef = useTemplateRef("form")
const { t } = useI18n()
const { props, event, close, open } = useDialog({
  width: "45vw",
  showClose: false,
})
const util = {
  getDefaultKbForm(): RAGEmbeddingConfig {
    return {
      id: "",
      name: "",
      embedding: {
        providerName: "",
        model: "",
        api: "",
        apiKey: "",
        method: "post",
      },
      rerank: {
        providerName: "",
        model: "",
        api: "",
        apiKey: "",
        method: "post",
      },
      dimensions: 1024,
      maxTokens: 512,
      maxInputs: 20,
      maxFileChunks: 512,
    }
  },
}
const cache = reactive({
  emForm: util.getDefaultKbForm(),
  keyword: "",
  currentId: "",
  current: null as RAGEmbeddingConfig | null,
  emFormRules: {} as Partial<Record<string, Arrayable<FormItemRule>>> | undefined,
})
const filterEmbeddings = computed(() =>
  embeddings.value.filter(v => v.name.includes(cache.keyword) || v.id.includes(cache.keyword))
)
const ev = {
  onOpenDlg(done: CallBackFn) {
    done()
    open()
  },
  onCloseDlg(done: CallBackFn) {
    formRef.value?.form?.resetFields()
    cache.emForm = util.getDefaultKbForm()
    done()
    close()
  },
  async onConfirmEdit(done: CallBackFn) {
    try {
      await formRef.value?.form?.validate()
    } catch (_) {
      done()
      return
    }
    try {
      const em = embeddings.value.find(kb => kb.id === cache.emForm.id)
      if (!em) {
        cache.emForm.id = uniqueId()
        await embeddingStore.api.add(cache.emForm)
        embeddings.value.push(cloneDeep(cache.emForm))
        cache.currentId = cache.emForm.id
      } else {
        Object.assign(em, cache.emForm)
        await embeddingStore.api.update(em)
      }
      ev.onCloseDlg(done)
    } catch (error) {
      msgError(errorToText(error))
      done()
    }
  },
  async onEdit(id: string, done: CallBackFn) {
    try {
      const kb = embeddings.value.find(em => em.id === id)
      if (kb) {
        cache.emForm = cloneDeep(kb)
        ev.onOpenDlg(done)
      }
    } catch (error) {
      done()
      msgError(errorToText(error))
    }
  },
  onEmbeddingChoose(em: RAGEmbeddingConfig) {
    cache.currentId = em.id
  },
}
settingsStore.dataWatcher<string>(
  SettingKeys.EmbeddingId,
  () => cache.currentId,
  cache.currentId,
  id => {
    if (!id) return
    const em = embeddings.value.find(v => v.id === id)
    if (!em) return
    cache.current = em
  }
)
</script>
<template>
  <ContentLayout custom>
    <template #header>
      <div class="p-1rem flex-1 flex flex-col">
        <div class="flex items-center">
          <Button type="primary" size="small" @click="ev.onOpenDlg">{{ t("btn.new") }}</Button>
        </div>
      </div>
    </template>
    <el-dialog v-bind="props" v-on="event" :title="t('embedding.editTitle')">
      <div class="h-70vh">
        <el-scrollbar>
          <EmbeddingForm ref="form" :form="cache.emForm" :rules="cache.emFormRules"></EmbeddingForm>
        </el-scrollbar>
      </div>
      <template #footer>
        <Button type="primary" @click="ev.onConfirmEdit">{{ t("btn.confirm") }}</Button>
        <Button @click="ev.onCloseDlg">{{ t("btn.cancel") }}</Button>
      </template>
    </el-dialog>
    <div class="flex flex-1 gap.5rem overflow-hidden">
      <div class="embedding-list">
        <div class="embedding-list-header">
          <el-input v-model="cache.keyword" :placeholder="t('embedding.search')" clearable />
        </div>
        <div class="embedding-list-content">
          <el-scrollbar>
            <div class="flex flex-col gap-[var(--ai-gap-base)]">
              <ContentBox
                v-for="em in filterEmbeddings"
                :key="em.id"
                background
                :default-lock="cache.current?.id === em.id"
                still-lock
                @click="ev.onEmbeddingChoose(em)">
                <template #icon>
                  <i-material-symbols:bookmark-stacks class="text-1.4rem" />
                </template>
                <el-text>{{ em.name }}</el-text>
              </ContentBox>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <div class="flex-1 flex">
        <EmbeddingForm v-if="cache.current" :form="cache.current"></EmbeddingForm>
        <el-empty v-else></el-empty>
      </div>
    </div>
  </ContentLayout>
</template>
<style lang="scss" scoped>
.embedding-list {
  border-right: solid 1px;
  border-color: var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: var(--ai-gap-medium);
  width: 30rem;
  gap: var(--ai-gap-medium);
  .embedding-list-header {
    flex-shrink: 0;
    display: flex;
    gap: var(--ai-gap-base);
  }
  .embedding-list-content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
