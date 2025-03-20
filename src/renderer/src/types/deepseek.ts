export type DSModelsResponse = {
  object: "list"
  data: {
    /**
     * @description 模型的标识符
     */
    id: string
    /**
     * @description 对象的类型，其值为 `model`
     */
    object: "model"
    /**
     * @description 拥有该模型的组织
     */
    owned_by: string
  }[]
}
export type DSUserBalanceResponse = {
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
export type DSMessageBase = {
  content: string
}
export type DSMessageSystem = DSMessageBase & {
  role: "system"
  name?: string
}
export type DSMessageUser = DSMessageBase & {
  role: "user"
  name?: string
}
export type DSMessageAssistant = DSMessageBase & {
  role: "assistant"
  name?: string
  prefix?: boolean
  reasoning_content?: string
}
export type DSMessageAssistantTool = DSMessageBase & {
  role: "tool"
  tool_call_id: string
}

export type DSMessage = DSMessageSystem | DSMessageUser | DSMessageAssistant | DSMessageAssistantTool
export type DSChatCompletionToolChoice = "none" | "auto" | "required"
export type DSChatCompletionNamedToolChoice = {
  type: "tool"
  function: Record<string, string>
}
export type DSToolChoice = DSChatCompletionToolChoice | DSChatCompletionNamedToolChoice
export type DsChatCompletionRequest = {
  messages: DSMessage[]
  model: "deepseek-reasoner" | "deepseek-chat"
  /**
   * @default 0
   * @description 介于 -2.0 和 2.0 之间的数字。如果该值为正，那么新 token 会根据其在已有文本中的出现频率受到相应的惩罚，降低模型重复相同内容的可能性。
   */
  frequency_penalty?: number
  /**
   * @default 4096
   * @description 介于 1 到 8192 间的整数，限制一次请求中模型生成 completion 的最大 token 数。输入 token 和输出 token 的总长度受模型的上下文长度的限制。如未指定 max_tokens参数，默认使用 4096。
   */
  max_tokens?: number
  /**
   * @default 0
   * @description 介于 -2.0 和 2.0 之间的数字。如果该值为正，那么新 token 会根据其是否已在已有文本中出现受到相应的惩罚，从而增加模型谈论新主题的可能性。
   */
  presence_penalty?: number
  /**
   * @description 一个 object，指定模型必须输出的格式。
   *
   * 设置为 { "type": "json_object" } 以启用 JSON 模式，该模式保证模型生成的消息是有效的 JSON。
   *
   * 注意: 使用 JSON 模式时，你还必须通过系统或用户消息指示模型生成 JSON。否则，模型可能会生成不断的空白字符，直到生成达到令牌限制，从而导致请求长时间运行并显得"卡住"。此外，如果 finish_reason="length"，这表示生成超过了 max_tokens 或对话超过了最大上下文长度，消息内容可能会被部分截断。
   */
  response_format?: {
    type: "text" | "json_object"
  }
  /**
   * @description 一个 string 或最多包含 16 个 string 的 list，在遇到这些词时，API 将停止生成更多的 token。
   */
  stop?: string[]
  /**
   * @description 如果设置为 True，将会以 SSE（server-sent events）的形式以流式发送消息增量。消息流以 data: [DONE] 结尾。
   */
  stream?: boolean
  /**
   * @description 流式输出相关选项。只有在 stream 参数为 true 时，才可设置此参数。
   */
  stream_options?: {
    /**
     * @description 如果设置为 true，在流式消息最后的 data: [DONE] 之前将会传输一个额外的块。此块上的 usage 字段显示整个请求的 token 使用统计信息，而 choices 字段将始终是一个空数组。所有其他块也将包含一个 usage 字段，但其值为 null。
     */
    include_usage: boolean
  }
  /**
   * @description 采样温度，介于 0 和 2 之间。更高的值，如 0.8，会使输出更随机，而更低的值，如 0.2，会使其更加集中和确定。 我们通常建议可以更改这个值或者更改 top_p，但不建议同时对两者进行修改。
   */
  temperature?: number
  /**
   * @description 作为调节采样温度的替代方案，模型会考虑前 top_p 概率的 token 的结果。所以 0.1 就意味着只有包括在最高 10% 概率中的 token 会被考虑。 我们通常建议修改这个值或者更改 temperature，但不建议同时对两者进行修改。
   */
  top_p?: number
  /**
   * @description 模型可能会调用的 tool 的列表。目前，仅支持 function 作为工具。使用此参数来提供以 JSON 作为输入参数的 function 列表。最多支持 128 个 function。
   */
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
  }
  /**
   * @description  控制模型调用 tool 的行为。
   * - `none` 意味着模型不会调用任何 tool，而是生成一条消息。
   * - `auto` 意味着模型可以选择生成一条消息或调用一个或多个 tool。
   * - `required` 意味着模型必须调用一个或多个 tool。
   * 通过 `{"type": "function", "function": {"name": "my_function"}}` 指定特定 tool，会强制模型调用该 tool。
   * 当没有 tool 时，默认值为 `none`。如果有 tool 存在，默认值为 `auto`。
   */
  tool_choice?: DSToolChoice
  /**
   * @description 是否返回所输出 token 的对数概率。如果为 true，则在 message 的 content 中返回每个输出 token 的对数概率。
   */
  logprobs?: boolean
  /**
   * @description 一个介于 0 到 20 之间的整数 N，指定每个输出位置返回输出概率 top N 的 token，且返回这些 token 的对数概率。指定此参数时，logprobs 必须为 true。
   */
  top_logprobs?: number
}

export type DsChatCompletionResponse = {
  id: string
  choices: {
    finish_reason: "stop" | "length" | "content_filter" | "tool_calls" | "insufficient_system_resource"
    index: number
    message: {
      content: string
      reasoning_content?: string
      tool_calls?: {
        id: string
        type: "function"
        function: {
          name: string
          arguments: string
        }
      }[]
    }
    logprobs: {
      content:
        | null
        | {
            token: string
            logprob: number
            bytes: null | number[]
            top_logprob: {
              token: string
              logprob: number
              bytes: null | number[]
            }[]
          }[]
    } | null
    text_offset: number
  }[]
  created: number
  model: string
  system_fingerprint: string
  object: "chat.completion"
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

export type DsChatCompletionResponseStreamBase = {
  id: string
  choices: {
    delta: {
      content: string | null
      reasoning_content: string | null
      role?: string
    }
    /**
     * @description 模型停止生成 `token` 的原因。
     * - `stop`：模型自然停止生成，或遇到 `stop` 序列中列出的字符串。
     * - `length` ：输出长度达到了模型上下文长度限制，或达到了 `max_tokens` 的限制。
     * - `content_filter`：输出内容因触发过滤策略而被过滤。
     * - `insufficient_system_resource`：由于后端推理资源受限，请求被打断。
     */
    finish_reason: "stop" | "length" | "content_filter" | "tool_calls" | "insufficient_system_resource" | null
    index: number
  }[]
  created: number
  model: string
  system_fingerprint: string
  object: "chat.completion.chunk"
}

export type DsChatCompletionResponseStreamEnd = "[DONE]"

export type DsChatCompletionResponseStream = DsChatCompletionResponseStreamBase | DsChatCompletionResponseStreamEnd
