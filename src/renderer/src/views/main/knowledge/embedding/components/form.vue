<script lang="ts" setup>
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { Arrayable } from "@vueuse/core"
import { FormItemRule, FormInstance, CascaderValue, CascaderProps, CascaderNode, Resolve } from "element-plus"
import useProviderStore from "@renderer/store/provider"
import useModelStore from "@renderer/store/model"
import { storeToRefs } from "pinia"
import { ModelMeta, ProviderMeta } from "@renderer/types"

const props = defineProps<{
  form: RAGEmbeddingConfig
}>()
const providerStore = useProviderStore()
const modelStore = useModelStore()
const { providerMetas } = storeToRefs(providerStore)
const { models } = storeToRefs(modelStore)
const { t } = useI18n()

const formRef = useTemplateRef<FormInstance>("formRef")
const form = computed(() => props.form)

const ev = {
  onSelect(meta: ProviderMeta) {
    console.log(meta)
  },
  onEmbeddingChange(value: CascaderValue | null | undefined) {
    console.log(value)
  },
  onRerankChange(value: CascaderValue | null | undefined) {
    console.log(value)
  },
  onLazyLoad(node: CascaderNode, resolve: Resolve, rerank?: boolean) {
    if (node.level == 0) {
      resolve(
        Object.values(providerMetas.value).map(val => {
          return {
            label: val.name,
            value: val,
            children: [],
          }
        })
      )
    } else if (node.level == 1) {
      if (!node.data.value) {
        resolve([])
        return
      }
      const data = node.data.value as ProviderMeta
      resolve(
        models.value
          .filter(
            v =>
              data.name === v.providerName &&
              (rerank ? modelStore.utils.isRerankerType(v) : modelStore.utils.isEmbeddingType(v))
          )
          .map(val => ({
            label: val.modelName,
            value: val,
            leaf: true,
          }))
      )
    } else {
      resolve([])
    }
  },
  onEmbeddingLazyLoad(node: CascaderNode, resolve: Resolve) {
    ev.onLazyLoad(node, resolve, false)
  },
  onRerankLazyLoad(node: CascaderNode, resolve: Resolve) {
    ev.onLazyLoad(node, resolve, true)
  },
}
const provider = reactive({
  props: {
    lazy: true,
    lazyLoad: ev.onEmbeddingLazyLoad,
  } as CascaderProps,
  propsRerank: {
    lazy: true,
    lazyLoad: ev.onRerankLazyLoad,
  } as CascaderProps,
  embedding: [] as (ProviderMeta | ModelMeta)[],
  rerank: [] as (ProviderMeta | ModelMeta)[],
  rules: {
    name: [{ type: "string", whitespace: false, required: true, message: t("form.stringFieldNotNull") }],
    embedding: [{ type: Object, required: true, message: t("form.stringFieldNotNull") }, {}],
  } as Partial<Record<string, Arrayable<FormItemRule>>>,
})

defineExpose({
  form: formRef,
})
</script>
<template>
  <el-form ref="formRef" :rules="provider.rules" :model="form" label-width="180px">
    <el-form-item prop="name" :label="t('embedding.name')">
      <el-input v-model.trim="form.name" :maxlength="120"></el-input>
    </el-form-item>
    <el-form-item prop="embedding" :label="t('embedding.embeddingProvider')">
      <el-cascader class="w-full" v-model="provider.embedding" :props="provider.props" @change="ev.onEmbeddingChange" />
    </el-form-item>
    <el-form-item prop="rerank" :label="t('embedding.rerankProvider')">
      <el-cascader class="w-full" v-model="provider.rerank" :props="provider.propsRerank" @change="ev.onRerankChange" />
    </el-form-item>
    <el-form-item prop="dimensions">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.dimensions") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.dimensionsDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number
        class="w-full!"
        :precision="0"
        :min="512"
        :max="9999"
        v-model="form.dimensions"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxTokens">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxTokens") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.maxTokensDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number class="w-full!" :precision="0" :min="128" :max="9999" v-model="form.maxTokens"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxInputs">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxInputs") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.maxInputsDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number class="w-full!" :precision="0" :min="10" :max="9999" v-model="form.maxInputs"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxFileChunks">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxFileChunks") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.maxFileChunksDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number
        class="w-full!"
        :precision="0"
        :min="128"
        :max="9999"
        v-model="form.maxFileChunks"></el-input-number>
    </el-form-item>
  </el-form>
</template>
<style lang="scss" scoped></style>
