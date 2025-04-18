import { MCPStdioServer } from "@renderer/types"

export const mcpStdioDefault = (): MCPStdioServer[] => {
  return [
    {
      serverName: "server-everything",
      command: "npx",
      disabled: false,
      args: ["-y", "@modelcontextprotocol/server-everything"],
    },
    {
      serverName: "server-filesystem",
      command: "npx",
      disabled: false,
      args: ["-y", "@modelcontextprotocol/server-filesystem", "D:\\"],
    },
  ]
}
