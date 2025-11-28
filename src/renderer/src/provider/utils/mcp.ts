import { Message, LLMToolCall, Role, LLMToolCallRequest } from "@renderer/types"
import { normalizetoolCallArgs } from "@shared/mcp"
import json5 from "json5"
export async function loadMCPTools(mcpServersIds: string[]): Promise<LLMToolCallRequest[]> {
  if (!window.api) {
    console.warn("[load local MCP tools] window.api not found")
    return []
  }
  const tools = (await window.api.mcp.listTools(mcpServersIds)).data.map<LLMToolCallRequest>(tool => {
    return {
      serverId: tool.serverId,
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
    const parse = (args: string) => {
      try {
        if (!args) return
        return json5.parse(normalizetoolCallArgs(args))
      } catch (e) {
        console.log("[parse tool calls args error]", e, args)
        return args
      }
    }
    for (const tool of tools) {
      const result = await window.api.mcp.callTool(tool.serverId, tool.function.name, parse(tool.function.arguments))
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
