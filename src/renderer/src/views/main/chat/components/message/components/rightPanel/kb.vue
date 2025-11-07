<script lang="ts" setup>
import { DialogPanel, Spinner } from "@toolmain/components"
import useKnowledgeStore from "@renderer/store/knowledge"
import useRagFilesStore from "@renderer/store/ragFiles"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import { ChatTopic } from "@renderer/types"
import FileItem from "@renderer/views/main/knowledge/components/fileItem.vue"
import { RAGLocalFileInfo } from "@shared/types/rag"
import { msgError, errorToText } from "@toolmain/shared"
const props = defineProps<{
  topic: ChatTopic
}>()
const knowledgeStore = useKnowledgeStore()
const ragFilesStore = useRagFilesStore()
const chatStore = useChatStore()

const { knowledges } = storeToRefs(knowledgeStore)
const { ragFiles } = storeToRefs(ragFilesStore)

const topic = computed(() => props.topic)
const fileList = computed<RAGLocalFileInfo[]>(() => {
  if (!props.topic.knowledgeId) return []
  return ragFiles.value[props.topic.knowledgeId] ?? []
})

const status = shallowReactive({
  loading: false,
  load: () => (status.loading = true),
  done: () => (status.loading = false),
})

const ev = {
  fetchRagFiles(kbId: string) {
    ragFilesStore.fetchAllByTopicId(kbId)
  },
  async onKbChange(kbId: string) {
    try {
      status.load()
      if (!ragFiles.value[kbId]) {
        await ragFilesStore.fetchAllByTopicId(kbId)
      }
      await chatStore.updateChatTopic(props.topic)
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      status.done()
    }
  },
}
</script>
<template>
  <DialogPanel>
    <template #header>
      <div class="flex-center gap-1rem">
        <Spinner v-model="status.loading" destroy-icon class="text-1.2rem font-bold"></Spinner>
        <el-select :disabled="status.loading" v-model="topic.knowledgeId" @change="ev.onKbChange" clearable>
          <el-option v-for="item in knowledges" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </div>
    </template>
    <FileItem :file-list view></FileItem>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
