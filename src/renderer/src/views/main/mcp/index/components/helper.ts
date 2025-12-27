import { MCPServerParam } from "@windflow/shared"
import { isObject, isHTTPUrl, isArray } from "@toolmain/shared"
import useMcpStore from "@renderer/store/mcp"

const mcpProperties = {
  type: "object",
  required: ["command", "args"],
  properties: {
    url: { type: "string" },
    command: { type: "string" },
    args: {
      type: "array",
      items: {
        type: "string",
      },
    },
    env: {
      type: "object",
      additionalProperties: {
        type: "string",
      },
    },
    cwd: { type: "string" },
  },
  additionalProperties: false,
}

/**
 * ```js
 * {
    "fetch": {
      "args": [
        "mcp-server-fetch"
      ],
      "command": "uvx"
    },
    // ...
  }
 * ```
 */
export const McpServerInnerSchema = {
  type: "object",
  additionalProperties: mcpProperties,
}
/**
 * ```js
 * {
    "mcpServers": {
      "fetch": {
        "args": [
          "mcp-server-fetch"
        ],
        "command": "uvx"
      }
   }
}
 * ```
 */
export const McpServersSchema = {
  type: "object",
  properties: {
    mcpServers: {
      type: "object",
      additionalProperties: mcpProperties,
    },
  },
  required: ["mcpServers"],
  additionalProperties: false,
}

export function assembleParam(
  name: string,
  value: MCPServerParam["params"],
  servers: MCPServerParam[],
  mcp: ReturnType<typeof useMcpStore>
) {
  if (!isObject(value.env)) value.env = {}
  if (!isArray(value.args)) value.args = []
  if (!isHTTPUrl(value.url)) {
    value.url = ""
  }
  let copyName = `${name}`
  copyName = servers.some(v => v.name === copyName) ? `${copyName}_copy` : copyName
  return mcp.clonePure({
    id: mcp.createNewId(),
    name: copyName,
    // default label is the same as name
    label: copyName,
    type: value.url ? "streamable" : "stdio",
    params: value,
    description: "",
  })
}
