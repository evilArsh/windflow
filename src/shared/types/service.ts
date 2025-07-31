import { BridgeResponse } from "./bridge"
import { ToolEnvironment, ToolEnvTestResult } from "./env"
import { EventKey, EventMap } from "./eventbus"
import {
  MCPCallToolResult,
  MCPListPromptsRequestParams,
  MCPListPromptsResponse,
  MCPListResourcesRequestParams,
  MCPListResourcesResponse,
  MCPListResourceTemplatesParams,
  MCPListResourceTemplatesResponse,
  MCPToolDetail,
  MCPServerParam,
  MCPRequestParams,
  MCPServerParamCore,
} from "./mcp"

export const IpcChannel = {
  McpStartServer: "mcp.startServer",
  McpStopServer: "mcp.stopServer",
  McpRestartServer: "mcp.restartServer",
  McpListTools: "mcp.listTools",
  McpCallTool: "mcp.callTool",
  McpListResources: "mcp.listResources",
  McpListPrompts: "mcp.listPrompts",
  McpListResourceTemplates: "mcp.listResourceTemplates",
  McpUpdateEnv: "mcp.updateEnv",
  McpGetReferences: "mcp.getReferences",
  McpGetTopicServers: "mcp.getTopicServers",
  McpStopTopicServers: "mcp.stopTopicServers",
  McpHasReference: "mcp.hasReference",

  EnvTestEnv: "env.testEnv",

  FileChooseFilePath: "file.chooseFilePath",

  ThemeSetTheme: "theme.setTheme",
}
export interface MCPService {
  updateEnv: (env: ToolEnvironment) => Promise<void>
  /**
   * @description 获取引用mcp服务的topicId列表
   */
  getReferences: (id: string) => Promise<BridgeResponse<Array<string>>>
  /**
   * @description 获取topicId引用的mcp服务列表
   */
  getTopicServers: (topicId: string) => Promise<BridgeResponse<Array<string>>>
  /**
   * @description 停止`topicId`下启动的服务，如果服务在被其他topic使用，则只删除引用
   */
  stopTopicServers: (topicId: string) => Promise<BridgeResponse<number>>
  /**
   * @description 判断`topicId`是否引用了mcp服务
   */
  hasReference: (id: string, topicId: string) => Promise<BridgeResponse<boolean>>
  startServer: (topicId: string, params: MCPServerParam) => Promise<void>
  stopServer: (topicId: string, id: string) => Promise<void>
  restartServer: (topicId: string, id: string, params?: MCPServerParamCore) => Promise<void>
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

export interface EventBus {
  on: <T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) => void
  off: <T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) => void
  emit: <T extends EventKey>(event: T, data: EventMap[T]) => void
}

export interface ThemeService {
  setTheme: (theme: "system" | "light" | "dark") => Promise<void>
}
