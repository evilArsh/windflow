import { BridgeResponse } from "./bridge"
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
  MCPClientStatus,
} from "./mcp"

export const IpcChannel = {
  McpRegisterServer: "mcp.registerServer",
  McpToggleServer: "mcp.toggleServer",
  McpListTools: "mcp.listTools",
  McpCallTool: "mcp.callTool",
  McpListResources: "mcp.listResources",
  McpListPrompts: "mcp.listPrompts",
  McpListResourceTemplates: "mcp.listResourceTemplates",
  McpUpdateEnv: "mcp.updateEnv",
  McpGetReference: "mcp.getReference",
  EnvTestEnv: "env.testEnv",
  FileChooseFilePath: "file.chooseFilePath",
}
export interface MCPService {
  updateEnv: (env: ToolEnvironment) => void
  getReference: (id: string) => Promise<BridgeResponse<Array<string>>>
  registerServer: (topicId: string, params: MCPServerParam) => Promise<BridgeResponse<MCPClientStatus>>
  toggleServer: (
    topicId: string,
    id: string,
    command: MCPClientHandleCommand
  ) => Promise<BridgeResponse<MCPClientStatus>>
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

export interface FileService {
  chooseFilePath: () => Promise<BridgeResponse<string>>
}
