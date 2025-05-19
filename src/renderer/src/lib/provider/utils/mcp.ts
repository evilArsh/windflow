import { LLMChatMessage, LLMToolCall, Role } from "@renderer/types"

export async function loadMCPTools(mcpServersIds: string[]) {
  if (!window.api) {
    console.warn("[load local MCP tools] window.api not found")
    return []
  }
  const tools = (await window.api.mcp.listTools(mcpServersIds)).data.map(tool => {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }
  })
  return tools
}
export async function callTools(tools: LLMToolCall[]): Promise<LLMChatMessage[]> {
  try {
    const results: LLMChatMessage[] = []
    for (const tool of tools) {
      const args = JSON.parse(tool.function.arguments)
      const result = await window.api.mcp.callTool(tool.function.name, args)
      results.push({
        role: Role.Tool,
        // patch deepseek
        content: JSON.stringify(result),
        tool_call_id: tool.id,
      })
    }
    return results
  } catch (error) {
    console.log("[call local tools error]", error)
    return []
  }
}
