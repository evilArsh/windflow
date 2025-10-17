import { Response } from "@toolmain/shared"
import { ToolEnvironment, ToolEnvTestResult } from "./types/env"
import { EventKey, EventMap } from "./types/eventbus"
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
} from "./types/mcp"
import { RAGEmbeddingConfig, RAGFile, RAGLocalFileMeta, RAGSearchParam } from "./types/rag"
import { Theme } from "./types/theme"
import { FileInfo } from "./types/files"

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
  McpTestEnv: "mcp.testEnv",

  FileChooseFilePath: "file.chooseFilePath",
  FileGetInfo: "file.getInfo",

  ThemeSetTheme: "theme.setTheme",

  RagSearch: "rag.search",
  RagProcessLocalFile: "rag.processLocalFile",
}
export interface MCPService {
  updateEnv: (env: ToolEnvironment) => Promise<void>
  /**
   * @description 获取引用mcp服务的topicId列表
   */
  getReferences: (id: string) => Promise<Response<Array<string>>>
  /**
   * @description 获取topicId引用的mcp服务列表
   */
  getTopicServers: (topicId: string) => Promise<Response<Array<string>>>
  /**
   * @description 停止`topicId`下启动的服务，如果服务在被其他topic使用，则只删除引用
   */
  stopTopicServers: (topicId: string) => Promise<Response<number>>
  /**
   * @description 判断`topicId`是否引用了mcp服务
   */
  hasReference: (id: string, topicId: string) => Promise<Response<boolean>>
  startServer: (topicId: string, params: MCPServerParam) => Promise<void>
  stopServer: (topicId: string, id: string) => Promise<void>
  restartServer: (topicId: string, id: string, params?: MCPServerParamCore) => Promise<void>
  callTool: (id: string, toolname: string, args?: Record<string, unknown>) => Promise<Response<MCPCallToolResult>>
  listTools: (id?: string | Array<string>) => Promise<Response<MCPToolDetail[]>>
  listResources: (
    id?: string | Array<string>,
    params?: MCPListResourcesRequestParams,
    options?: MCPRequestParams
  ) => Promise<Response<MCPListResourcesResponse>>
  listPrompts: (
    id?: string | Array<string>,
    params?: MCPListPromptsRequestParams,
    options?: MCPRequestParams
  ) => Promise<Response<MCPListPromptsResponse>>
  listResourceTemplates: (
    id?: string | Array<string>,
    params?: MCPListResourceTemplatesParams,
    options?: MCPRequestParams
  ) => Promise<Response<MCPListResourceTemplatesResponse>>
  // --- env
  testEnv: (env: ToolEnvironment) => Promise<Response<ToolEnvTestResult>>
}

export interface FileService {
  chooseFilePath: () => Promise<Response<string[]>>
  getInfo: (absPath: string[]) => Promise<Response<FileInfo[]>>
}

export interface EventBus {
  on: <T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) => void
  off: <T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) => void
  emit: <T extends EventKey>(event: T, data: EventMap[T]) => void
}

export interface ThemeService {
  setTheme: (theme: Theme) => Promise<void>
}

export interface RAGService {
  search: (content: RAGSearchParam, config: RAGEmbeddingConfig) => Promise<Response<RAGFile[]>>
  processLocalFile: (file: RAGLocalFileMeta, config: RAGEmbeddingConfig) => Promise<void>
}
