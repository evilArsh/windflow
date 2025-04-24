import { MCPStdioServer } from "@renderer/types"

export const mcpStdioDefault = (): MCPStdioServer[] => {
  return [
    {
      id: "server-everything",
      serverName: "server-everything",
      command: "npx",
      disabled: false,
      args: ["-y", "@modelcontextprotocol/server-everything"],
    },
    {
      id: "server-filesystem",
      serverName: "server-filesystem",
      command: "npx",
      disabled: false,
      args: ["-y", "@modelcontextprotocol/server-filesystem", "D:\\"],
    },
  ]
}
