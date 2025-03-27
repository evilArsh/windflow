import { ChatTopic, ChatMessage } from "@renderer/types"
export const chatTopicDefault = (): ChatTopic[] => []
export const chatMessageDefault = (): ChatMessage => ({
  id: uniqueId(),
  data: [
    {
      id: uniqueId(),
      finish: true,
      status: 200,
      time: formatSecond(new Date()),
      content: {
        role: "",
        content: "",
      },
      modelId: "",
    },
  ],
})
