import { MCPEnvironment, MCPServerParam } from "@shared/types/mcp"

export const mcpStdioDefault = (): MCPServerParam[] => {
  return [
    {
      type: "stdio",
      id: "server-everything",
      serverName: "server-everything",
      description: "",
      params: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-everything"],
        env: {},
      },
    },
    {
      type: "stdio",
      id: "server-filesystem",
      serverName: "server-filesystem",
      description: "",
      params: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "D:\\"],
        env: {},
      },
    },
  ]
}

export const defaultEnv = (): MCPEnvironment => ({
  npm: {
    registry: "https://registry.npmmirror.com",
    mirrors: [
      { label: "taobao", value: "https://registry.npmmirror.com" },
      { label: "npm", value: "https://registry.npmjs.org" },
    ],
  },
  node: {
    path: "node",
  },
  python: {
    path: "python",
    uvPath: "uv",
    uvxPath: "uvx",
  },
  bun: {
    path: "bun",
  },
})
