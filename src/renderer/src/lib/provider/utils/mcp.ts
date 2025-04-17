import { LLMBaseRequest, LLMChatMessage, LLMChatResponse, LLMToolCall, Role } from "@renderer/types"
import { errorToText } from "@shared/error"

export async function loadOpenAIMCPTools(request: LLMBaseRequest) {
  const tools = (await window.api.mcp.listTools()).data.map(tool => {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }
  })
  // request["tool_calls"] = tools // openai
  request["tools"] = tools // deepseek
}
export async function callOpenAITool(tools: LLMToolCall[]): Promise<LLMChatMessage[]> {
  // export async function callOpenAITool(tools: LLMToolCall[]): Promise<LLMChatMessage[] | LLMChatResponse> {
  try {
    const results: LLMChatMessage[] = []
    for (const tool of tools) {
      const args = JSON.parse(tool.function.arguments)
      const result = await window.api.mcp.callTool(tool.function.name, args)
      results.push({
        role: Role.Tool,
        content: result.data.content,
        tool_call_id: tool.id,
      })
    }
    return results
  } catch (error) {
    console.error("[callOpenAITool]", error)
    return []
    // return {
    //   role: Role.Assistant,
    //   content: errorToText(error),
    //   status: 500,
    // } as LLMChatResponse
  }
}
