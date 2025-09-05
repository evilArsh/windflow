<script setup lang="ts">
import useModelStore from "@renderer/store/model"
import { storeToRefs } from "pinia"
import type { ModelMeta, ChatTopic } from "@renderer/types"
import useProviderStore from "@renderer/store/provider"
import { DialogPanel } from "@toolmain/components"
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

const activeModels = ref<Record<string, ModelMeta[]>>({})
watchEffect(() => {
  activeModels.value = models.value
    .filter(v => v.active)
    .reduce((acc, cur) => {
      if (acc[cur.providerName]) {
        acc[cur.providerName].push(cur)
      } else {
        acc[cur.providerName] = [cur]
      }
      return acc
    }, {})
})
</script>
<template>
  <el-popover placement="top" :width="500" trigger="hover" popper-style="--el-popover-padding: 0">
    <template #reference>
      <el-badge :value="data.modelIds.length" type="primary">
        <ContentBox background>
          <i-fluent-emoji-flat:wrapped-gift class="text-1.6rem"></i-fluent-emoji-flat:wrapped-gift>
        </ContentBox>
      </el-badge>
    </template>
    <DialogPanel>
      <template #header>
        <el-text>{{ t("chat.model.label") }}</el-text>
      </template>
      <div class="h-40rem w-full flex">
        <el-checkbox-group
          v-model="data.modelIds"
          @change="emit('change', data)"
          class="line-height-unset! w-full text-inherit">
          <div class="select-wrap">
            <ContentBox v-for="(item, provider) in activeModels" normal :key="provider">
              <template #icon>
                <Svg class="text-2.5rem" :src="providerStore.getProviderLogo(provider)"></Svg>
              </template>
              <el-text type="primary">{{ provider }}</el-text>
              <template #footer>
                <div class="flex flex-col gap5px">
                  <div v-for="model in item" :key="model.id">
                    <ContentBox background class="m0!">
                      <el-checkbox :value="model.id" :label="model.modelName">
                        <ModelName :data="model"></ModelName>
                      </el-checkbox>
                    </ContentBox>
                    <el-divider class="my-.25rem!"></el-divider>
                  </div>
                </div>
              </template>
            </ContentBox>
          </div>
        </el-checkbox-group>
      </div>
    </DialogPanel>
  </el-popover>
</template>
<style lang="scss" scoped>
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
