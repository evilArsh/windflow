<script lang="ts" setup>
import { ChatTopic } from "@windflow/core/types"
import useKnowledgeStore from "@renderer/store/knowledge"
import useRagFilesStore from "@renderer/store/ragFiles"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import FileItem from "@renderer/views/main/knowledge/components/fileItem.vue"
import { RAGLocalFileInfo } from "@windflow/shared"
import { errorToText } from "@toolmain/shared"
import Shell from "./components/shell.vue"
import { msgError } from "@renderer/utils"

import { CollapseActiveName } from "element-plus"
import { AbbrsNode } from "@renderer/components/Abbrs"
import { Spinner } from "@toolmain/components"
const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const knowledgeStore = useKnowledgeStore()
const ragFilesStore = useRagFilesStore()
const chatStore = useChatStore()

const { knowledges } = storeToRefs(knowledgeStore)
const { ragFiles } = storeToRefs(ragFilesStore)

const topic = computed(() => props.topic)
const activeIds = computed(() => topic.value.knowledgeId)
const cache = shallowReactive<Record<string, RAGLocalFileInfo[]>>({})
const currentActive = computed<AbbrsNode[]>(() => {
  return knowledges.value.reduce<AbbrsNode[]>((acc, cur) => {
    if (activeIds.value?.includes(cur.id)) {
      acc.push({
        data: cur.name.slice(0, 1),
        type: "text",
      })
    }
    return acc
  }, [])
})
const useStatus = () => {
  const loading = ref(false)
  function load() {
    loading.value = true
  }
  function done() {
    loading.value = false
  }
  return { loading, load, done }
}
const status = useStatus()
const ev = {
  fetchRagFiles(kbId: string) {
    ragFilesStore.fetchAllByTopicId(kbId)
  },
  async onKbChange() {
    try {
      status.load()
      await chatStore.updateChatTopic(props.topic)
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      status.done()
    }
  },
  async beforeCollapse(kbId: CollapseActiveName) {
    try {
      status.load()
      const id = String(kbId)
      if (!ragFiles.value[id]) {
        await ragFilesStore.fetchAllByTopicId(id)
      }
      // await chatStore.updateChatTopic(props.topic)
      if (!cache[id]) {
        cache[id] = ragFiles.value[id]
      }
      return true
    } catch (error) {
      msgError(errorToText(error))
      status.done()
      return true
    } finally {
      status.done()
    }
  },
  refreshKnowledges() {
    topic.value.knowledgeId = topic.value.knowledgeId.filter(kbId => {
      return knowledges.value.some(kb => kb.id === kbId)
    })
    ev.onKbChange()
  },
}
watch(topic, ev.refreshKnowledges, {
  immediate: true,
})
</script>
<template>
  <Shell>
    <template #reference>
      <ContentBox
        style="
          --box-border-color: var(--el-border-color-light);
          --box-border-radius: 1rem;
          --box-border-size: 1px;
          --box-padding: 2px;
          --box-border-hover-color: var(--el-border-color-dark);
          --box-border-active-color: var(--el-border-color-darker);
        "
        normal>
        <div class="flex-center gap-.5rem">
          <ContentBox style="--box-border-radius: 1rem" background>
            <i-material-symbols-book-4-spark class="text-1.6rem" />
          </ContentBox>
          <Abbrs
            :max-length="5"
            :spacing="10"
            style="--abbrs-padding: 3px"
            width="22"
            height="22"
            :data="currentActive"></Abbrs>
        </div>
      </ContentBox>
    </template>
    <template #header>
      <el-text>{{ t("chat.kb.label") }}</el-text>
      <Spinner :model-value="toValue(status.loading)"></Spinner>
    </template>
    <template #default>
      <div class="h-40rem w-full">
        <el-checkbox-group
          v-model="topic.knowledgeId"
          @change="ev.onKbChange"
          class="line-height-unset! w-full text-inherit">
          <el-collapse :before-collapse="ev.beforeCollapse">
            <el-collapse-item v-for="item in knowledges" :key="item.id" :title="item.name" :name="item.id">
              <template #title>
                <div class="flex items-center justify-start">
                  <el-checkbox @click.stop :value="item.id"> </el-checkbox>
                  <el-text>{{ item.name }}</el-text>
                </div>
              </template>
              <div class="max-h-40rem">
                <FileItem :file-list="cache[item.id] ?? []" view :knowledge-id="item.id"></FileItem>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-checkbox-group>
      </div>
    </template>
  </Shell>
</template>
<style lang="scss" scoped></style>
