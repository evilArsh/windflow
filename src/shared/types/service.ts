import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol"
import { BridgeResponse, BridgeStatusResponse } from "./bridge"
import {
  MCPCallToolResult,
  MCPListPromptsRequestParams,
  MCPListPromptsResponse,
  MCPListResourcesRequestParams,
  MCPListResourcesResponse,
  MCPListResourceTemplatesParams,
  MCPListResourceTemplatesResponse,
  MCPStdioServersParams,
  MCPToolDetail,
} from "./mcp"

export const IpcChannel = {
  McpRegisterClient: "mcp.registerClient",
  McpToggleClient: "mcp.toggleClient",
  McpListTools: "mcp.listTools",
  McpCallTool: "mcp.callTool",
  McpListResources: "mcp.listResources",
  McpListPrompts: "mcp.listPrompts",
  McpListResourceTemplates: "mcp.listResourceTemplates",
}
export interface MCPService {
  registerClient: (name: string, serverParams: MCPStdioServersParams) => Promise<BridgeStatusResponse>
  toggleClient: (name: string, disabled: boolean) => Promise<BridgeStatusResponse>
  callTool: (toolname: string, args?: Record<string, unknown>) => Promise<BridgeResponse<MCPCallToolResult>>
  listTools: (clientName?: string) => Promise<BridgeResponse<MCPToolDetail[]>>
  listResources: (
    params?: MCPListResourcesRequestParams,
    options?: RequestOptions
  ) => Promise<BridgeResponse<MCPListResourcesResponse[]>>
  listPrompts: (
    params?: MCPListPromptsRequestParams,
    options?: RequestOptions
  ) => Promise<BridgeResponse<MCPListPromptsResponse[]>>
  listResourceTemplates: (
    params?: MCPListResourceTemplatesParams,
    options?: RequestOptions
  ) => Promise<BridgeResponse<MCPListResourceTemplatesResponse[]>>
}
