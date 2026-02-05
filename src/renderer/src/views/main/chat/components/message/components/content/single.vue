<script setup lang="ts">
import { ChatListDisplayStyle, ChatMessageTree, ChatTopic, SettingKeys } from "@windflow/core/types"
import { CallBackFn, code1xx, errorToText, isString } from "@toolmain/shared"
import useModelsStore from "@renderer/store/model"
import useSettingsStore from "@renderer/store/settings"
import { Affix } from "@toolmain/components"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Thinking from "./thinking.vue"
import MCPCall from "./mcpcall.vue"
import Image from "./image.vue"
import Error from "./error.vue"
import useChatStore from "@renderer/store/chat"
import { Role } from "@windflow/core/types"
import { useMsgContext } from "../../../../index"
import { msg, msgError } from "@renderer/utils"
import { useThrottleFn } from "@vueuse/core"
const props = defineProps<{
  message: ChatMessageTree
  parent?: ChatMessageTree
  topic: ChatTopic
  header?: boolean
  context: ReturnType<typeof useMsgContext>
}>()

const settingsStore = useSettingsStore()
const affixRef = useTemplateRef("affix")
const affixIconRef = useTemplateRef("affixIcon")

const modelsStore = useModelsStore()
const chatStore = useChatStore()

const topic = computed(() => props.topic)
const message = computed(() => props.message)

const id = useId()
const isUser = computed(() => message.value.node.content.role === Role.User)
const isText = computed(() => !message.value.node.type || message.value.node.type === "text")
const isImage = computed(() => message.value.node.type === "image")
const isPartial = computed(() => code1xx(message.value.node.status) || message.value.node.status == 206)
const { data: forcePlaintext } = settingsStore.dataBind<boolean>(SettingKeys.ChatForcePlaintext)
const { data: chatListDisplay } = settingsStore.dataBind<ChatListDisplayStyle>(SettingKeys.ChatListDisplayStyle)
const reverse = computed(() => chatListDisplay.value === ChatListDisplayStyle.Chat && isUser.value)
const svgSrc = computed(() =>
  modelsStore.getModelLogo(message.value.node.modelId ? modelsStore.find(message.value.node.modelId) : undefined)
)
async function onContentDelete(m: ChatMessageTree, done: CallBackFn) {
  try {
    await chatStore.deleteMessage(m)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  } finally {
    done()
  }
}
async function onEdit(done: CallBackFn) {
  try {
    props.context.messageDialog.updateMessages(message.value.node)
    props.context.messageDialog.open()
    const res = await props.context.messageDialog.wait()
    if (res) {
      await chatStore.updateChatMessage(res)
      Object.assign(message.value.node, res)
    }
  } catch (error) {
    msgError(errorToText(error))
  } finally {
    done()
  }
}
const onUpdateAffix = useThrottleFn(
  () => {
    nextTick(() => {
      affixRef.value?.update()
      affixIconRef.value?.update()
    })
  },
  200,
  true,
  true
)
settingsStore.dataListen<string>(SettingKeys.ChatPanelWidth, onUpdateAffix)
onMounted(() => {
  props.context.menuToggle.watchToggle(onUpdateAffix)
})
onBeforeUnmount(() => {
  props.context.menuToggle.unWatchToggle(onUpdateAffix)
})
defineExpose({
  update: onUpdateAffix,
})
</script>
<template>
  <MsgBubble class="chat-item-container" :reverse :id>
    <template v-if="svgSrc" #icon>
      <Affix
        style="--affix-fix-shadow: none; --affix-fix-bg-color: var(--el-bg-color)"
        ref="affixIcon"
        :offset="88"
        :target="`#${id}`">
        <ContentBox class="m0! flex-shrink-0">
          <Svg :src="svgSrc" class="flex-1 text-3rem"></Svg>
        </ContentBox>
      </Affix>
    </template>
    <template v-if="header" #header>
      <Affix ref="affix" :offset="88" :target="`#${id}`">
        <Title :message :reverse>
          <Handler :topic :parent :message @delete="done => onContentDelete(message, done)" @edit="onEdit"> </Handler>
        </Title>
      </Affix>
    </template>
    <div v-if="isUser" class="chat-item-content p[var(--ai-gap-medium)]" :class="{ reverse }">
      <p
        class="flex flex-col"
        :class="[reverse ? 'items-end' : '']"
        v-if="!forcePlaintext || !isString(message.node.content.content)">
        {{ message.node.content.content }}
      </p>
      <Markdown
        v-else
        :content="message.node.content.content"
        :force-plaintext="!!forcePlaintext"
        @updated="onUpdateAffix"></Markdown>
    </div>
    <div v-else class="chat-item-content p[var(--ai-gap-medium)]">
      <Image v-if="isImage" :message :parent></Image>
      <div v-else-if="isText" class="chat-item-content">
        <div v-for="(child, index) in message.node.content.children" :key="index" class="chat-item-content">
          <Thinking :message="child" :finish="!!message.node.finish"></Thinking>
          <Markdown v-if="isString(child.content)" :content="child.content" @updated="onUpdateAffix" />
          <MCPCall :message="child"></MCPCall>
        </div>
        <Error :message></Error>
      </div>
      <i-svg-spinners-pulse-3 v-if="isPartial" class="text-1.4rem m3px"></i-svg-spinners-pulse-3>
    </div>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-container {
  .chat-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 1.4rem;
    gap: var(--ai-gap-base);
    &.reverse {
      justify-content: flex-end;
    }
  }
}
</style>
