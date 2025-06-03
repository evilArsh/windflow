import { BridgeResponse, BridgeStatusResponse } from "./bridge"
import { ToolEnvironment, ToolEnvTestResult } from "./env"
import {
  MCPCallToolResult,
  MCPListPromptsRequestParams,
  MCPListPromptsResponse,
  MCPListResourcesRequestParams,
  MCPListResourcesResponse,
  MCPListResourceTemplatesParams,
  MCPListResourceTemplatesResponse,
  MCPClientHandleCommand,
  MCPToolDetail,
  MCPServerParam,
  MCPRequestParams,
} from "./mcp"

export const IpcChannel = {
  McpRegisterServer: "mcp.registerServer",
  McpToggleServer: "mcp.toggleServer",
  McpListTools: "mcp.listTools",
  McpCallTool: "mcp.callTool",
  McpListResources: "mcp.listResources",
  McpListPrompts: "mcp.listPrompts",
  McpListResourceTemplates: "mcp.listResourceTemplates",
  EnvTestEnv: "env.testEnv",
}
export interface MCPService {
  registerServer: (params: MCPServerParam) => Promise<BridgeStatusResponse>
  toggleServer: (id: string, command: MCPClientHandleCommand) => Promise<BridgeStatusResponse>
  callTool: (toolname: string, args?: Record<string, unknown>) => Promise<BridgeResponse<MCPCallToolResult>>
  listTools: (id?: string | Array<string>) => Promise<BridgeResponse<MCPToolDetail[]>>
  listResources: (
    id?: string | Array<string>,
    params?: MCPListResourcesRequestParams,
    options?: MCPRequestParams
  ) => Promise<BridgeResponse<MCPListResourcesResponse>>
  listPrompts: (
    id?: string | Array<string>,
    params?: MCPListPromptsRequestParams,
    options?: MCPRequestParams
  ) => Promise<BridgeResponse<MCPListPromptsResponse>>
  listResourceTemplates: (
    id?: string | Array<string>,
    params?: MCPListResourceTemplatesParams,
    options?: MCPRequestParams
  ) => Promise<BridgeResponse<MCPListResourceTemplatesResponse>>
}

export interface EnvService {
  testEnv: (args: ToolEnvironment) => Promise<BridgeResponse<ToolEnvTestResult>>
}
