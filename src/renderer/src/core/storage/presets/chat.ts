import { ChatTopic, Message, Role, LLMConfig, TTIConfig } from "../../types/index"
import { merge } from "@toolmain/shared"
import Chance from "chance"
export const chatTopicDefault = (): ChatTopic[] => []
export function defaultTTIConfig(): TTIConfig {
  return {
    n: 1,
    size: "",
    seed: new Chance().integer({ min: 0, max: 99999999 }),
    num_inference_steps: 20,
    guidance_scale: 7.5,
    negative_prompt: "",
  }
}
export function defaultLLMConfig(): LLMConfig {
  return {
    temperature: 1,
    top_p: 1,
    stream: true,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 4096,
  }
}

export function defaultMessage(init?: Partial<Message>): Message {
  return merge(
    {
      role: Role.Assistant,
      content: "",
      reasoning_content: "",
      tool_call_id: "",
      tool_calls: undefined,
      children: undefined,
      finish_reason: "",
      usage: {
        completion_tokens: 0,
        prompt_tokens: 0,
        total_tokens: 0,
      },
    },
    init
  )
}
