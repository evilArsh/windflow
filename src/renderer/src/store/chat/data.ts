import {
  ChatLLMConfig,
  ChatMessage,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  SettingKeys,
  Settings,
} from "@renderer/types"
import { db } from "@renderer/usable/useDatabase"
import PQueue from "p-queue"
import { Reactive } from "vue"
import { chatTopicDefault } from "./default"
import useSettingsStore from "@renderer/store/settings"
import { cloneDeep } from "@shared/utils"

export const useData = (topicList: Reactive<Array<ChatTopicTree>>, currentNodeKey: Ref<string>) => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const mqueue = markRaw(new PQueue({ concurrency: 1 }))
  const cnfQueue = markRaw(new PQueue({ concurrency: 1 }))
  const settingsStore = useSettingsStore()

  async function addChatTopic(data: ChatTopic) {
    return db.chatTopic.add(cloneDeep(data))
  }
  async function addChatMessage(data: ChatMessage) {
    return db.chatMessage.add(cloneDeep(data))
  }
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const addChatLLMConfig = async (data: ChatLLMConfig) =>
    cnfQueue.add(async () => db.chatLLMConfig.add(cloneDeep(data)))
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const addChatTTIConfig = async (data: ChatTTIConfig) =>
    cnfQueue.add(async () => db.chatTTIConfig.add(cloneDeep(data)))
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const updateChatTopic = async (data: ChatTopic) => queue.add(async () => db.chatTopic.put(cloneDeep(data)))
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const updateChatMessage = async (data: ChatMessage) => mqueue.add(async () => db.chatMessage.put(cloneDeep(data)))
  async function updateChatLLMConfig(data: ChatLLMConfig) {
    return db.chatLLMConfig.put(cloneDeep(data))
  }
  async function updateChatTTIConfig(data: ChatTTIConfig) {
    return db.chatTTIConfig.put(cloneDeep(data))
  }
  async function getChatTTIConfig(topicId: string) {
    return db.chatTTIConfig.where("topicId").equals(topicId).first()
  }
  async function getChatLLMConfig(topicId: string) {
    return db.chatLLMConfig.where("topicId").equals(topicId).first()
  }
  /**
   * @description 查找对应的聊天消息
   */
  async function getChatMessage(topicId: string) {
    const res = (await db.chatMessage.where("topicId").equals(topicId).sortBy("index")).reverse()
    if (res) {
      res.forEach(item => {
        item.finish = true
        item.status = 200
        item.children?.forEach(child => {
          child.finish = true
          child.status = 200
        })
      })
    }
    return res
  }
  async function deleteChatMessage(messageId: string) {
    return db.chatMessage.delete(messageId)
  }
  async function getTopic(topicId: string) {
    return db.chatTopic.get(topicId)
  }
  /**
   * @description 删除对应的聊天组和聊天消息
   */
  async function delChatTopic(data: ChatTopic[]) {
    return db.transaction("rw", db.chatMessage, db.chatTopic, db.chatLLMConfig, db.chatTTIConfig, async trans => {
      for (const item of data) {
        await trans.chatTopic.delete(item.id)
        await trans.chatMessage.where("topicId").equals(item.id).delete()
        await trans.chatLLMConfig.where("topicId").equals(item.id).delete()
        await trans.chatTTIConfig.where("topicId").equals(item.id).delete()
      }
    })
  }
  const fetch = async () => {
    topicList.length = 0
    const assembleTopicTree = (data: ChatTopic[], cb: (item: ChatTopicTree) => void): ChatTopicTree[] => {
      const res: ChatTopicTree[] = []
      const maps: Record<string, ChatTopicTree> = {}
      data.forEach(item => {
        maps[item.id] = { id: item.id, node: item, children: [] }
        cb(maps[item.id])
      })
      data.forEach(item => {
        if (!item.parentId) {
          res.push(maps[item.id])
        } else {
          if (maps[item.parentId]) {
            maps[item.parentId].children.push(maps[item.id])
            maps[item.parentId].children.sort((a, b) => a.node.index - b.node.index)
          }
        }
      })
      return res
    }
    const data = await db.chatTopic.toCollection().sortBy("index")
    const defaultData = chatTopicDefault()
    for (const item of defaultData) {
      if (!data.find(v => v.id === item.id)) {
        data.push(item)
        await db.chatTopic.add(item)
      }
    }
    // --- 恢复状态
    const nodeKeyData = (await db.settings.get(SettingKeys.ChatCurrentNodeKey)) as Settings<string> | undefined
    currentNodeKey.value = nodeKeyData ? nodeKeyData.value : ""
    topicList.push(
      ...assembleTopicTree(data, item => {
        item.node.requestCount = 0
      })
    )
  }
  settingsStore.api.dataWatcher<string>(SettingKeys.ChatCurrentNodeKey, currentNodeKey, "")
  return {
    fetch,
    addChatTopic,
    addChatMessage,
    addChatLLMConfig,
    addChatTTIConfig,
    updateChatTopic,
    updateChatMessage,
    updateChatLLMConfig,
    updateChatTTIConfig,
    getTopic,
    getChatMessage,
    getChatTTIConfig,
    getChatLLMConfig,
    delChatTopic,
    deleteChatMessage,
  }
}
