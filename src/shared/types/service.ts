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
  MCPServerHandleCommand,
  MCPStdioServersParams,
  MCPToolDetail,
} from "./mcp"

export const IpcChannel = {
  McpRegisterServer: "mcp.registerServer",
  McpToggleServer: "mcp.toggleServer",
  McpListTools: "mcp.listTools",
  McpCallTool: "mcp.callTool",
  McpListResources: "mcp.listResources",
  McpListPrompts: "mcp.listPrompts",
  McpListResourceTemplates: "mcp.listResourceTemplates",
}
export interface MCPService {
  registerServer: (serverName: string, serverParams: MCPStdioServersParams) => Promise<BridgeStatusResponse>
  toggleServer: (serverName: string, command: MCPServerHandleCommand) => Promise<BridgeStatusResponse>
  callTool: (toolname: string, args?: Record<string, unknown>) => Promise<BridgeResponse<MCPCallToolResult>>
  listTools: (serverName?: string | Array<string>) => Promise<BridgeResponse<MCPToolDetail[]>>
  listResources: (
    serverName?: string | Array<string>,
    params?: MCPListResourcesRequestParams,
    options?: RequestOptions
  ) => Promise<BridgeResponse<MCPListResourcesResponse>>
  listPrompts: (
    serverName?: string | Array<string>,
    params?: MCPListPromptsRequestParams,
    options?: RequestOptions
  ) => Promise<BridgeResponse<MCPListPromptsResponse>>
  listResourceTemplates: (
    serverName?: string | Array<string>,
    params?: MCPListResourceTemplatesParams,
    options?: RequestOptions
  ) => Promise<BridgeResponse<MCPListResourceTemplatesResponse>>
}
