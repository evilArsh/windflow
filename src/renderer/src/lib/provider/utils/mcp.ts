import { LLMBaseRequest } from "@renderer/types"

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
