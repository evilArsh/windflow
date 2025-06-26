import { ChatMessage, ChatTopic, ChatTopicTree, SettingKeys, Settings } from "@renderer/types"
import { db } from "@renderer/usable/useDatabase"
import PQueue from "p-queue"
import { Reactive } from "vue"
import { chatMessageDefault, chatTopicDefault } from "./default"
import useSettingsStore from "@renderer/store/settings"

export const useData = (
  topicList: Reactive<Array<ChatTopicTree>>,
  chatMessage: Reactive<Record<string, ChatMessage>>,
  currentNodeKey: Ref<string>
) => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const mqueue = markRaw(new PQueue({ concurrency: 1 }))
  const settingsStore = useSettingsStore()
  const topicToTree = (topic: ChatTopic): ChatTopicTree => {
    return { id: topic.id, node: topic, children: [] }
  }
  const assembleTopicTree = (data: ChatTopic[], cb: (item: ChatTopicTree) => void): ChatTopicTree[] => {
    const res: ChatTopicTree[] = []
    const maps: Record<string, ChatTopicTree> = {}
    data.forEach(item => {
      maps[item.id] = topicToTree(item)
      cb(maps[item.id])
    })
    data.forEach(item => {
      if (!item.parentId) {
        res.push(maps[item.id])
      } else {
        if (maps[item.parentId]) {
          maps[item.parentId].children.push(maps[item.id])
        }
      }
    })
    return res
  }
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const updateChatTopic = async (data: ChatTopic) => queue.add(() => db.chatTopic.update(data.id, toRaw(data)))

  async function addChatTopic(data: ChatTopic) {
    return db.chatTopic.add(toRaw(data))
  }
  async function addChatMessage(data: ChatMessage) {
    return db.chatMessage.add(toRaw(data))
  }
  async function createNewMessage() {
    const msg = chatMessageDefault()
    await addChatMessage(msg)
    return msg
  }
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const updateChatMessage = async (data: ChatMessage) => mqueue.add(() => db.chatMessage.update(data.id, toRaw(data)))
  /**
   * @description 查找对应的聊天消息
   */
  async function getChatMessage(messageId: string) {
    const res = await db.chatMessage.get(messageId)
    if (res) {
      res.data.forEach(item => {
        item.finish = true
        item.status = 200
      })
    }
    return res
  }
  async function getTopic(topicId: string) {
    return db.chatTopic.get(topicId)
  }
  /**
   * @description 删除对应的聊天组和聊天消息
   */
  async function delChatTopic(data: ChatTopic[]) {
    return db
      .transaction("rw", db.chatMessage, db.chatTopic, async trans => {
        for (const item of data) {
          trans.chatTopic.delete(item.id)
          if (item.chatMessageId) {
            trans.chatMessage.delete(item.chatMessageId)
          }
        }
      })
      .then(() => {
        return true
      })
      .catch(error => {
        console.log(`[dbDelChatTopic]`, error)
        return false
      })
  }
  const fetch = async () => {
    try {
      topicList.length = 0
      for (const key in chatMessage) {
        delete chatMessage[key]
      }
      const data = await db.chatTopic.orderBy("createAt").toArray()
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
        ...assembleTopicTree(data, async item => {
          item.node.requestCount = 0
        })
      )
    } catch (error) {
      console.error(`[fetch chat topic]`, error)
    }
  }
  settingsStore.api.dataWatcher<string>(SettingKeys.ChatCurrentNodeKey, currentNodeKey, "")
  return {
    fetch,
    updateChatTopic,
    addChatTopic,
    getTopic,
    addChatMessage,
    updateChatMessage,
    getChatMessage,
    delChatTopic,
    createNewMessage,
  }
}
