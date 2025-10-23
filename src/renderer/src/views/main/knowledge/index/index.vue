<script lang="ts" setup>
import useKnowledgeStore from "@renderer/store/knowledge"
import useRagFilesStore from "@renderer/store/ragFiles"
import useSettingsStore from "@renderer/store/settings"
import useEmbeddingStore from "@renderer/store/embedding"
import RagFile from "../components/ragFile.vue"
import { storeToRefs } from "pinia"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { Knowledge } from "@renderer/types/knowledge"
import { cloneDeep, useDialog, CallBackFn, errorToText, msgError, uniqueId } from "@toolmain/shared"
import { SettingKeys } from "@renderer/types"
import { RAGLocalFileInfo } from "@shared/types/rag"
const router = useRouter()
const addFormRef = useTemplateRef("addForm")

const knowledgeStore = useKnowledgeStore()
const ragFilesStore = useRagFilesStore()
const settingsStore = useSettingsStore()
const embeddingStore = useEmbeddingStore()
const { knowledges } = storeToRefs(knowledgeStore)
const { ragFiles } = storeToRefs(ragFilesStore)
const { embeddings } = storeToRefs(embeddingStore)
const { t } = useI18n()
const { props, event, close, open } = useDialog({
  width: "50rem",
  showClose: false,
})
const util = {
  getDefaultKbForm(): Knowledge {
    return {
      id: "",
      name: "",
      embeddingId: "",
      type: "rag",
    }
  },
  toEmbeddingPage() {
    router.replace({
      path: "/main/knowledge/embedding",
      query: {
        command: "add",
      },
    })
  },
}
const cache = reactive({
  // add/edit new knowledge base dialog form
  kbForm: util.getDefaultKbForm(),
  // list filter keyword
  keyword: "",
  currentFileNum: 0,
  currentId: "",
  current: null as Knowledge | null,
  fetchCurrentFiles: markRaw(async (currentId: string) => {
    try {
      if (!ragFiles.value[currentId]) {
        await ragFilesStore.fetchAllByTopicId(currentId)
      }
    } catch (error) {
      msgError(errorToText(error))
    }
  }),
})
const filterKnowledges = computed(() =>
  knowledges.value.filter(v => v.name.includes(cache.keyword) || v.id.includes(cache.keyword))
)
const ev = {
  onOpenDlg(done: CallBackFn) {
    done()
    open()
  },
  onCloseDlg(done: CallBackFn) {
    addFormRef.value?.resetFields()
    cache.kbForm = util.getDefaultKbForm()
    done()
    close()
  },
  async onConfirmEdit(done: CallBackFn) {
    try {
      await addFormRef.value?.validate()
    } catch (_) {
      done()
      return
    }
    try {
      const kb = knowledges.value.find(kb => kb.id === cache.kbForm.id)
      if (!kb) {
        cache.kbForm.id = uniqueId()
        await knowledgeStore.add(cache.kbForm)
        cache.currentId = cache.kbForm.id
      } else {
        Object.assign(kb, cache.kbForm)
        await knowledgeStore.update(kb)
      }
      ev.onCloseDlg(done)
    } catch (error) {
      msgError(errorToText(error))
      done()
    }
  },
  async onEdit(knowledgeId: string, fileList: RAGLocalFileInfo[], done: CallBackFn) {
    try {
      const kb = knowledges.value.find(kb => kb.id === knowledgeId)
      if (kb) {
        cache.kbForm = cloneDeep(kb)
        cache.currentFileNum = fileList.length
        ev.onOpenDlg(done)
      }
    } catch (error) {
      done()
      msgError(errorToText(error))
    }
  },
  async onRemove(knowledgeId: string, done: CallBackFn) {
    try {
      await knowledgeStore.remove(knowledgeId)
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },

  onKnowledgeChoose(kb: Knowledge) {
    cache.currentId = kb.id
  },
}
settingsStore.dataWatcher<string>(
  SettingKeys.KnowledgeId,
  () => cache.currentId,
  cache.currentId,
  id => {
    if (!id) return
    const kb = knowledges.value.find(v => v.id === id)
    if (!kb) return
    cache.current = kb
    cache.fetchCurrentFiles(kb.id)
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
    <el-dialog v-bind="props" v-on="event" :title="t('knowledge.editTitle')">
      <div class="h-30rem">
        <el-form ref="addForm" :model="cache.kbForm" label-width="100px">
          <el-form-item
            :label="t('knowledge.name')"
            required
            prop="name"
            :rules="[{ type: 'string', whitespace: false, required: true, message: t('form.stringFieldNotNull') }]">
            <el-input v-model.trim="cache.kbForm.name" :maxlength="120"></el-input>
          </el-form-item>
          <el-form-item
            prop="embeddingId"
            :label="t('knowledge.embedding')"
            required
            :rules="[{ type: 'string', whitespace: false, required: true, message: t('form.selectFieldNotNull') }]">
            <el-select v-model="cache.kbForm.embeddingId" :disabled="!!cache.currentFileNum">
              <el-option v-for="em in embeddings" :key="em.id" :label="em.name" :value="em.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button link @click="util.toEmbeddingPage" size="small" type="primary">
              {{ t("form.addNewEmbedding") }}
              <i class="i-material-symbols:arrow-outward"></i>
            </el-button>
          </el-form-item>
          <el-form-item prop="type" :label="t('knowledge.type')">
            <el-select v-model="cache.kbForm.type">
              <el-option label="rag" value="rag"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <Button type="primary" @click="ev.onConfirmEdit">{{ t("btn.confirm") }}</Button>
        <Button @click="ev.onCloseDlg">{{ t("btn.cancel") }}</Button>
      </template>
    </el-dialog>
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
        <RagFile v-if="cache.current" :knowledge="cache.current" @remove="ev.onRemove" @edit="ev.onEdit"></RagFile>
      </div>
    </div>
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
