import { msgError, errorToText, isArrayLength, merge, cloneDeep, uniqueId, isUndefined } from "@toolmain/shared"
import { createChatTopic } from "@windflow/core/message"
import { ChatEventResponse, ChatMessage, ChatTopic, Role } from "@windflow/core/types"
import { useMessage, useModels } from "./useCore"
import { defaultLLMConfig } from "@windflow/core/storage"
import { isChatType } from "@windflow/core/models"

/**
 * mini LLM topic, use for individual chating situation
 */
export function useMiniTopic(initial?: Partial<ChatTopic>) {
  const modelMgr = useModels()
  const manager = useMessage()
  const storage = manager.getStorage()
  const { t } = useI18n()
  const message = ref<ChatMessage>() // latest message of topic
  const _topicId = ref(uniqueId())
  const topic = ref(
    createChatTopic(
      merge(
        {
          id: _topicId.value,
          modelIds: [],
          prompt: t("chat.defaultPrompt"),
        },
        initial
      )
    )
  )
  /**
   * initialize data with specified topic id
   */
  async function initTopic(topicId: string) {
    manager.off(_topicId.value, onMessageReceived)
    manager.on(topicId, onMessageReceived)
    _topicId.value = topicId
    const t = await manager.getStorage().getTopic(_topicId.value)
    if (t) {
      topic.value = t
    } else {
      topic.value.id = _topicId.value
      await manager.getStorage().addChatTopic(topic.value)
    }
    let config = await manager.getStorage().getChatLLMConfig(_topicId.value)
    if (!config) {
      config = { ...defaultLLMConfig(), id: _topicId.value, topicId: _topicId.value }
    }
    // default set to no reasoning
    if (!isUndefined(config.reasoning)) {
      config.reasoning = false
    }
    await manager.getStorage().putChatLLMConfig(config)
    if (!isArrayLength(topic.value.modelIds)) {
      const fModel = (await modelMgr.getStorage().getMostFrequentModels(10)).filter(isChatType)
      if (isArrayLength(fModel)) {
        topic.value.modelIds = [fModel[0].id]
      }
    }
    const messages = await storage.getChatMessages(_topicId.value)
    message.value = isArrayLength(messages) ? messages[messages.length - 1] : undefined
    if (message.value) {
      message.value.finish = true
      message.value.status = 200
    }
  }
  function onMessageReceived(e: ChatEventResponse) {
    if (!e.message) return
    if (e.message.content.role === Role.Assistant) {
      if (!message.value) {
        message.value = cloneDeep(e.message)
      } else {
        Object.assign(message.value, e.message)
      }
    }
  }
  async function update() {
    try {
      await storage.putChatTopic(topic.value)
    } catch (error) {
      msgError(errorToText(error))
    }
  }

  manager.on(_topicId.value, onMessageReceived)
  onBeforeUnmount(() => {
    manager.off(_topicId.value, onMessageReceived)
  })
  return {
    topic,
    message,
    manager,
    update,
    initTopic,
  }
}
