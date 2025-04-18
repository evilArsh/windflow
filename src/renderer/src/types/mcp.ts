export interface MCPStdioServer {
  command: string
  serverName: string
  disabled?: boolean
  args?: string[]
  env?: Record<string, string>
  cwd?: string
}
