import { Message, LLMToolCall, Role } from "@renderer/types"
import { useToolCall } from "@shared/mcp"
import json5 from "json5"
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
export async function callTools(tools: LLMToolCall[]): Promise<Message[]> {
  try {
    if (!window.api) {
      console.warn("[call tools] window.api not found")
      return []
    }
    const results: Message[] = []
    for (const tool of tools) {
      const args = tool.function.arguments
        ? json5.parse(useToolCall().normalizetoolCallArgs(tool.function.arguments))
        : tool.function.arguments
      const result = await window.api.mcp.callTool(tool.function.name, args)
      results.push({
        role: Role.Tool,
        // patch deepseek
        content: json5.stringify(result.data.content),
        tool_call_id: tool.id,
      })
    }
    return results
  } catch (error) {
    console.log("[call local tools error]", error)
    return []
  }
}
