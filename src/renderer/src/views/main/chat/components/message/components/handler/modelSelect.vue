<script setup lang="ts">
import useModelStore from "@renderer/store/model"
import Shell from "./components/shell.vue"
import { storeToRefs } from "pinia"
import type { ModelMeta, ChatTopic } from "@windflow/core/types"
import useProviderStore from "@renderer/store/provider"
import { AbbrsNode } from "@renderer/components/Abbrs"
import { isArrayLength } from "@toolmain/shared"
import { isASRType, isChatReasonerType, isChatType, isImageType, isTTSType, isVideoType } from "@windflow/core/models"
import Group from "./components/group.vue"
const emit = defineEmits<{
  (e: "change", topic: ChatTopic): void
}>()
const props = defineProps<{
  topic: ChatTopic
}>()
const data = computed(() => props.topic)
const { t } = useI18n()
const providerStore = useProviderStore()
const modelStore = useModelStore()
const { models } = storeToRefs(modelStore)

const activeModels = computed<Record<string, ModelMeta[]>>(() =>
  models.value
    .filter(
      v =>
        v.active &&
        isArrayLength(v.type) &&
        (isChatReasonerType(v) || isASRType(v) || isChatType(v) || isImageType(v) || isTTSType(v) || isVideoType(v))
    )
    .reduce<Record<string, ModelMeta[]>>((acc, cur) => {
      if (acc[cur.providerName]) {
        acc[cur.providerName].push(cur)
      } else {
        acc[cur.providerName] = [cur]
      }
      return acc
    }, {})
)
const activeModelsIcons = computed<AbbrsNode[]>(() =>
  data.value.modelIds.map(modelId => {
    return {
      data: modelStore.getModelLogo(modelStore.find(modelId)),
      type: "svg",
    }
  })
)
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
            <i-material-symbols-featured-seasonal-and-gifts
              class="text-1.6rem"></i-material-symbols-featured-seasonal-and-gifts>
          </ContentBox>
          <Abbrs
            :max-length="5"
            :spacing="12"
            style="--abbrs-padding: 3px"
            width="22"
            height="22"
            :data="activeModelsIcons"></Abbrs>
        </div>
      </ContentBox>
    </template>
    <template #header>
      <el-text>{{ t("chat.model.label") }}</el-text>
    </template>
    <template #default>
      <div class="h-40rem w-full flex">
        <el-checkbox-group v-model="data.modelIds" @change="emit('change', data)" class="w-full text-inherit">
          <div class="select-wrap">
            <Group>
              <ContentBox v-for="(item, provider) in activeModels" normal :key="provider">
                <template #icon>
                  <Svg class="text-2.5rem" :src="providerStore.getProviderLogo(provider)"></Svg>
                </template>
                <el-text type="primary">{{ provider }}</el-text>
                <template #footer>
                  <Group>
                    <ContentBox v-for="model in item" :key="model.id" class="setting-box">
                      <el-checkbox :value="model.id" :label="model.modelName">
                        <ModelName :data="model"></ModelName>
                      </el-checkbox>
                    </ContentBox>
                  </Group>
                </template>
              </ContentBox>
            </Group>
          </div>
        </el-checkbox-group>
      </div>
    </template>
  </Shell>
</template>
<style lang="scss" scoped>
@use "./components/common.scss";
.select-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--ai-gap-base);
  :deep(.el-checkbox) {
    margin-right: 0;
  }
  :deep(.el-checkbox__label) {
    overflow: hidden;
  }
}
</style>
