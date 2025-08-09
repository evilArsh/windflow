import { ChatMessage, ChatTopic, ProviderMeta, Role } from "@renderer/types"
import { cloneDeep } from "@shared/utils"
import { Transaction } from "dexie"

export async function migrateToV2(tx: Transaction) {
  console.log("[migrateToV2]")
  await tx
    .table("mcpServer")
    .toCollection()
    .modify(server => {
      if (isString(server.serverName)) {
        server.name = server.serverName
        delete server.serverName
      }
    })
}
export async function migrateToV4(tx: Transaction) {
  console.log("[migrateToV4]")
  await tx
    .table("providerMeta")
    .toCollection()
    .modify((meta: ProviderMeta) => {
      if (!meta.id) {
        meta.id = uniqueId()
      }
    })
  await tx
    .table("chatTopic")
    .toCollection()
    .modify((topic: ChatTopic) => {
      if (!isNumber(topic.index)) {
        topic.index = 0
      }
    })
  const oldTopicMessageId: Record<string, string> = {}
  const newMessages: Array<ChatMessage & { time?: string }> = []
  await tx.table("chatTopic").each((topic: ChatTopic & { chatMessageId?: string }) => {
    if (topic.chatMessageId) {
      oldTopicMessageId[topic.chatMessageId] = topic.id
    }
  })
  await tx.table("chatMessage").each(msg => {
    if (Array.isArray(msg.data) && oldTopicMessageId[msg.id]) {
      const length = msg.data.length
      msg.data.forEach((message: ChatMessage & { time?: string }, index: number) => {
        const newMessage = {
          ...message,
          createAt: message.time ? new Date(message.time).getTime() : Date.now(),
          index: length - index,
          topicId: oldTopicMessageId[msg.id],
        }
        delete newMessage["time"]
        newMessages.push(newMessage)
      })
    }
  })
  await tx.table("chatMessage").clear()
  await tx.table("chatMessage").bulkAdd(newMessages)
}

export async function migrateToV5(tx: Transaction) {
  console.log("[migrateToV5]")
  await tx
    .table("chatMessage")
    .toCollection()
    .modify((msg: ChatMessage) => {
      if (msg.content.role === Role.Assistant && !msg.content.children) {
        msg.content.children = [cloneDeep(msg.content)]
      }
      if (msg.children?.length) {
        msg.children.forEach(child => {
          if (!child.content.children) {
            child.content.children = [cloneDeep(child.content)]
          }
        })
      }
    })
}
