<script lang="ts" setup>
import useKnowledgeStore from "@renderer/store/knowledge"
// import useRagFilesStore from "@renderer/store/ragFiles"
import useSettingsStore from "@renderer/store/settings"
import useEmbeddingStore from "@renderer/store/embedding"
import { storeToRefs } from "pinia"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import { cloneDeep, useDialog, CallBackFn, errorToText, msgError, uniqueId } from "@toolmain/shared"
import { SettingKeys } from "@renderer/types"
import EmbeddingForm from "./components/form.vue"
import { RAGEmbeddingConfig } from "@shared/types/rag"
const route = useRoute()

const knowledgeStore = useKnowledgeStore()
// const ragFilesStore = useRagFilesStore()
const settingsStore = useSettingsStore()
const embeddingStore = useEmbeddingStore()
// const { knowledges } = storeToRefs(knowledgeStore)
// const { ragFiles } = storeToRefs(ragFilesStore)
const { embeddings } = storeToRefs(embeddingStore)
const formRef = useTemplateRef("form")
const formConfirmRef = useTemplateRef("formConfirm")
const { t } = useI18n()
const { props, event, close, open } = useDialog({
  width: "50vw",
  showClose: false,
  destroyOnClose: true,
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

const current = ref<RAGEmbeddingConfig | null>(null)
const cache = reactive({
  mode: "" as "add" | "edit" | "view",
  emForm: util.getDefaultKbForm(),
  keyword: "",
  currentId: "",
})
const filterEmbeddings = computed<RAGEmbeddingConfig[]>(() =>
  embeddings.value.filter(v => v.name.includes(cache.keyword) || v.id.includes(cache.keyword))
)
const ev = {
  onOpenDlg(mode: "add" | "edit" | "view", done?: CallBackFn) {
    done?.()
    cache.mode = mode
    open()
  },
  onCloseDlg(done?: CallBackFn) {
    formRef.value?.form?.resetFields()
    cache.emForm = util.getDefaultKbForm()
    close()
    done?.()
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
        await embeddingStore.add(cache.emForm)
        cache.currentId = cache.emForm.id
      } else {
        Object.assign(em, cache.emForm)
        await embeddingStore.update(em)
      }
      ev.onCloseDlg(done)
    } catch (error) {
      msgError(errorToText(error))
      done()
    }
  },
  async onOpenEdit(node: RAGEmbeddingConfig) {
    cache.emForm = cloneDeep(node)
    ev.onOpenDlg("edit")
  },
  async onDelete(embeddingId: string, done: CallBackFn) {
    try {
      const count = await knowledgeStore.findByEmbeddingId(embeddingId)
      if (count.length > 0) {
        throw new Error(
          t("embedding.deleteWithKnowledgeBind", { count: count.length, name: count.map(item => item.name).join(",") })
        )
      }
      await embeddingStore.remove(embeddingId)
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
  onEmbeddingChoose(em: RAGEmbeddingConfig) {
    cache.currentId = em.id
  },
  onFormEnterConfirm() {
    formConfirmRef.value?.click()
  },
}
settingsStore.dataWatcher<string>(SettingKeys.EmbeddingId, toRef(cache, "currentId"), "", id => {
  if (!id) return
  const em = embeddings.value.find(v => v.id === id)
  if (!em) return
  current.value = em
})
onMounted(() => {
  route.query.command == "add" && ev.onOpenDlg("add")
})
</script>
<template>
  <ContentLayout custom>
    <template #header>
      <div class="p-1rem flex-1 flex flex-col">
        <div class="flex items-center">
          <el-button type="primary" size="small" @click="ev.onOpenDlg('add')">{{ t("btn.new") }}</el-button>
        </div>
      </div>
    </template>
    <el-dialog v-bind="props" v-on="event" :title="t('embedding.editTitle')">
      <div class="h-50vh">
        <el-scrollbar view-class="pr-1rem">
          <EmbeddingForm
            ref="form"
            :form="cache.emForm"
            @enter="ev.onFormEnterConfirm"
            :mode="cache.mode"></EmbeddingForm>
        </el-scrollbar>
      </div>
      <template #footer>
        <Button ref="formConfirm" type="primary" @click="ev.onConfirmEdit">{{ t("btn.confirm") }}</Button>
        <Button @click="ev.onCloseDlg">{{ t("btn.cancel") }}</Button>
      </template>
    </el-dialog>
    <ContentLayout style="--ai-header-height: auto" custom>
      <template #header>
        <div class="p-1rem w-full">
          <el-input v-model="cache.keyword" :placeholder="t('embedding.search')" clearable />
        </div>
      </template>
      <el-scrollbar style="flex: 1" view-class="bg-[var(--el-fill-color-light)] min-h-full">
        <div class="flex flex-col w-full p-1rem">
          <ContentBox
            v-for="item in filterEmbeddings"
            style="--box-bg-color: var(--el-bg-color); --content-box-padding: var(--ai-gap-base)"
            class="select-unset! mb-1rem!"
            :key="item.id">
            <i class="i-material-symbols-bookmark-stacks text-3rem"></i>
            <ContentBox class="flex-1 select-unset!" normal>
              <el-space>
                <el-text type="primary">{{ item.name }}</el-text>
              </el-space>
              <template #end> </template>
              <template #footer>
                <div class="flex flex-wrap">
                  <el-text size="small" type="info">{{ item.embedding.providerName }}</el-text>
                  <el-divider direction="vertical"></el-divider>
                  <el-text size="small" type="primary">embedding:</el-text>
                  <el-text size="small" type="info">{{ item.embedding.model }} </el-text>
                  <el-divider direction="vertical"></el-divider>
                  <el-text size="small" type="primary">rerank:</el-text>
                  <el-text size="small" type="info">{{ item.rerank?.model }} </el-text>
                </div>
              </template>
            </ContentBox>
            <template #footer>
              <el-popconfirm :title="t('tip.deleteConfirm')">
                <template #reference>
                  <el-button size="small" round text type="danger">
                    <i class="i-ep-delete text-1.4rem"></i>
                  </el-button>
                </template>
                <template #actions="{ cancel }">
                  <div class="flex justify-between">
                    <Button type="danger" size="small" @click="done => ev.onDelete(item.id, done)">
                      {{ t("tip.yes") }}
                    </Button>
                    <el-button size="small" @click="cancel">{{ t("btn.cancel") }}</el-button>
                  </div>
                </template>
              </el-popconfirm>
              <el-button size="small" round text type="warning" @click="ev.onOpenEdit(item)">
                <i class="i-ep-edit text-1.4rem"></i>
              </el-button>
              <el-divider direction="vertical"></el-divider>
            </template>
          </ContentBox>
        </div>
      </el-scrollbar>
    </ContentLayout>
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
  width: 100%;
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
