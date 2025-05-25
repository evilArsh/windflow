import { ChatTopic, ChatMessage } from "@renderer/types"
export const chatTopicDefault = (): ChatTopic[] => []
export const chatMessageDefault = (): ChatMessage => ({
  id: uniqueId(),
  data: [],
})
