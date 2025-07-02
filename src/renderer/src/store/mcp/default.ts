import { MCPServerParam } from "@shared/types/mcp"

export const mcpStdioDefault = (): MCPServerParam[] => {
  return [
    {
      type: "stdio",
      id: "server-everything",
      name: "server-everything",
      description: "",
      params: {
        url: "",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-everything"],
        env: {},
      },
    },
    {
      type: "stdio",
      id: "server-filesystem",
      name: "server-filesystem",
      description: "",
      params: {
        url: "",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "D:\\"],
        env: {},
      },
    },
  ]
}
