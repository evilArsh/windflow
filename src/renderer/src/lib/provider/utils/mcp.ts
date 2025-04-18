import { LLMBaseRequest, LLMChatMessage, LLMToolCall, Role } from "@renderer/types"

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
  console.log("[loadOpenAIMCPTools]", tools)
}
export async function callOpenAITool(tools: LLMToolCall[]): Promise<LLMChatMessage[]> {
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
    console.log("[callOpenAITool]", results)
    return results
  } catch (error) {
    console.log("[callOpenAITool error]", error)
    return []
  }
}
