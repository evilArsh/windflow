import { LLMBaseRequest, Role } from "./chat"

export type SFModelsResponse = {
  object: "list"
  data: {
    id: string
    object: string
    owned_by: string
    created: number
  }[]
}
export type SFUserBalanceResponse = {
  code: number
  message: string
  status: boolean
  data: {
    id: string
    name: string
    image: string
    email: string
    isAdmin: boolean
    balance: string
    status: string
    introduction: string
    role: string
    chargeBalance: string
    totalBalance: string
  }
}
export type SFMessage = {
  content: string
  role: Role.System | Role.User | Role.Assistant
}

export interface SFChatCompletionRequest extends LLMBaseRequest {
  model: string
  messages: SFMessage[]
  stream?: boolean
  max_tokens?: number
  stop?: string[]
  temperature?: number
  top_p?: number
  top_k?: number
  frequency_penalty?: number
  n?: number
  response_format?: {
    // type: "text" | "json_object"
    type: string
  }
  tools?: {
    type: "function"
    function: {
      description: string
      name: string
      parameters: {
        type: "object"
        properties: Record<string, any>
      }
      strict?: boolean
    }
  }
}

export type SFChatCompletionResponse = {
  id: string
  choices: {
    index: number
    delta: {
      content: string
      reasoning_content?: string
    }
    finish_reason: "stop" | "eos" | "length" | "tool_calls"
    // finish_reason: "stop" | "eos" | "length" | "tool_calls"
    // message: {
    //   role: string
    //   content: string
    //   reasoning_content?: string
    //   tool_calls?: {
    //     id: string
    //     type: "function"
    //     function: {
    //       name: string
    //       arguments: string
    //     }
    //   }[]
    // }
  }[]
  created: number
  model: string
  object: string
  usage: {
    completion_tokens: number
    prompt_tokens: number
    prompt_cache_hit_tokens: number
    prompt_cache_miss_tokens: number
    total_tokens: number
    completion_tokens_details?: {
      reasoning_tokens: number
    }
  }
}
