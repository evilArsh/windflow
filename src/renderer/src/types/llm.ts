/**
 * 兼容openai的message类型
 */
export interface LLMBaseRequest {
  [x: string]: unknown
}
export enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Developer = "developer",
}
export type MessageDeveloper = {
  content: string
  role: Role.Developer
  name?: string
}
export type MessageSystem = {
  content: string
  role: Role.System
  name?: string
}
export type PlainToolChoice = "none" | "auto" | "required"
export type NamedToolChoice = {
  type: "function"
  function: Record<string, string> // {"type": "function", "function": {"name": "my_function"}}
}
export type ToolChoice = PlainToolChoice | NamedToolChoice

export type MessageAssistant = {
  role: Role.Assistant
  content: string | { text: string; type: string }[] | { refusal: string; type: string }[]
  name?: string
  // deepseek (Beta) 设置此参数为 true，来强制模型在其回答中以此 assistant 消息中提供的前缀内容开始。您必须设置 base_url="https://api.deepseek.com/beta" 来使用此功能。
  prefix?: boolean
  // deepseek (Beta) 用于 deepseek-reasoner 模型在对话前缀续写功能下，作为最后一条 assistant 思维链内容的输入。使用此功能时，prefix 参数必须设置为 true。
  reasoning_content?: string
  audio?: { id: string } // https://platform.openai.com/docs/api-reference/chat/create
  refusal?: string
  tool_calls?: {
    id: string
    type: string
    function: {
      name: string
      arguments: string
    }
  }[]
}
export type MessageUser = {
  content:
    | string
    | { text: string; type: string }[]
    | { image_url: string; type: string }[]
    | {
        input_audio: {
          data: string
          format: string // wav,mp3
        }
      }[]
    | {
        file: {
          file_data?: string
          filed_id?: string
          filename?: string
        }
        type: "file"
      }[]
  role: Role.User
  name?: string
}
export type MessageAssistantTool = {
  role: Role.Tool
  content: string | string[]
  tool_call_id: string
}

export type Message = MessageSystem | MessageUser | MessageAssistant | MessageAssistantTool | MessageDeveloper

export interface ChatCompletionRequest extends LLMBaseRequest {
  messages: Message[]
  model: string
  audio?: {
    format: string //wav, mp3, flac, opus, pcm16
    voice: string // alloy, ash, ballad, coral, echo, sage, shimmer.
  }
  frequency_penalty?: number
  logit_bias?: Record<string, any> // openai
  logprobs?: boolean
  max_tokens?: number
  max_completion_tokens?: number // openai
  metadata?: any // openai
  modalities?: string[] // openai
  n?: number // openai
  parallel_tool_calls?: boolean // openai
  // openai
  prediction?: {
    content: string | string[]
    type: string
  }
  presence_penalty?: number
  reasoning_effort?: string // openai,low, medium, and high
  response_format?: {
    type:
      | "text"
      | "json_object"
      | { json_schema: { name: string; description?: string; schema?: any; strict?: boolean } }
  }
  service_tier?: string // openai
  store?: boolean // openai
  seed?: number
  stop?: string[]
  stream?: boolean
  stream_options?: {
    include_usage: boolean
  }
  temperature?: number
  top_p?: number
  tools?: {
    type: "function"
    function: {
      description: string
      name: string
      parameters: {
        type: "object"
        properties: Record<string, any>
      }
    }
  }[]
  tool_choice?: ToolChoice
  top_logprobs?: number
  user?: string // openai
  web_search_options?: {
    search_context_size?: string // low, medium, high
    user_location?: {
      approximate: {
        city?: string
        country?: string
        region?: string
        timezone?: string
      }
      type: string // approximate
    }
  }
}

export type ChatCompletionResponse = {
  id: string
  choices: {
    finish_reason: string
    index: number
    message: {
      content: string
      role: string
      refusal?: string
      reasoning_content?: string
      tool_calls?: {
        id: string
        type: "function"
        function: {
          name: string
          arguments: string
        }
      }[]
      audio?: {
        data: string
        expires_at: number
        id: string
        transcript: string
      }
    }
    logprobs?: {
      content?: {
        token: string
        logprob: number
        bytes?: number[]
        top_logprob: {
          token: string
          logprob: number
          bytes?: number[]
        }[]
      }[]
      refusal?: {
        bytes?: number[]
        logprob: number
        token: string
        top_logprob: {
          token: string
          logprob: number
          bytes?: number[]
        }[]
      }[]
    }
    text_offset: number
  }[]
  created: number
  model: string
  system_fingerprint: string
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

export type ChatCompletionResponseStream = {
  id: string
  choices: {
    delta: {
      content?: string
      reasoning_content?: string
      refusal?: string
      role: string
      tool_calls?: {
        id: string
        type: string
        function: {
          name: string
          arguments: string
        }
      }[]
    }
    finish_reason?: string
    index: number
  }[]
  created: number
  model: string
  object: string
  service_tier?: string
  system_fingerprint: string
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
    completion_tokens_details?: {
      accepted_prediction_tokens: number
      rejected_prediction_tokens: number
      reasoning_tokens: number
      audio_tokens: number
    }
  }
  prompt_tokens_details?: {
    audio_tokens: number
    cached_tokens: number
  }
}

export type ModelsResponse = {
  object: string
  data: {
    id: string
    object: string
    owned_by: string
    created: number
  }[]
}

export type DeepSeekBalance = {
  /**
   * @description 当前账户是否有余额可供 API 调用
   */
  is_available: boolean
  balance_infos: {
    /**
     * @description 货币，人民币或美元
     */
    currency: "CNY" | "USD"
    /**
     * @description 总的可用余额，包括赠金和充值余额
     */
    total_balance: string
    /**
     * @description 未过期的赠金余额
     */
    granted_balance: string
    /**
     * @description 充值余额
     */
    topped_up_balance: string
  }[]
}

export type SiliconFlowBalance = {
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
