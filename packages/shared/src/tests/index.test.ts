import { describe, expect, it } from "vitest"
import { useSchemaValidate } from "../mcp"

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
const McpServersSchema = {
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
describe("mcp config schema validation", () => {
  it("mcp schema failed", () => {
    const ajv = useSchemaValidate()
    const s = {
      mcfasfpSservers: {
        fetch: {
          args: ["mcp-server-fetch"],
          command: "uvx",
          env: {},
          url: "",
        },
      },
    }
    const [ok, err] = ajv.validate(McpServersSchema, s)
    console.log(err)
    expect(ok).toBe(false)
  })
  it("mcp schema success", () => {
    const ajv = useSchemaValidate()
    const s = {
      mcpServers: {
        fetch: {
          args: ["mcp-server-fetch"],
          command: "uvx",
          env: {},
          url: "",
        },
      },
    }
    const [ok, err] = ajv.validate(McpServersSchema, s)
    console.log(err)
    expect(ok).toBe(true)
  })
})
