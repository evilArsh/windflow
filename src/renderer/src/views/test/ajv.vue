<script lang="ts" setup>
import Ajv from "ajv"
import AjvErrors from "ajv-errors"
function useToolCall() {
  const ajv = new Ajv({
    strict: true, // 强制校验 Schema 本身的合法性
    allErrors: true, // 收集所有错误
    verbose: false,
    formats: {
      uri: true,
      email: true,
      date: true,
      "date-time": true,
      ipv4: true,
      ipv6: true,
      regex: true,
    },
  })
  AjvErrors(ajv)
  /**
   * @description llm返回的函数调用参数处理
   */
  function normalizetoolCallArgs(args: string): string {
    return args.replaceAll("\\", "\\\\")
  }
  function validate(tool: Record<string, unknown>, args?: Record<string, unknown>): boolean {
    if (!tool.inputSchema) return true
    const validate = ajv.compile(tool.inputSchema)
    const valid = validate(args)
    console.log(valid, validate.errors)
    return valid
  }
  return {
    validate,
    normalizetoolCallArgs,
  }
}
const call = useToolCall()
function test1() {
  try {
    const res = call.validate(
      {
        inputSchema: {
          type: "object",
          properties: {
            thought: {
              type: "string",
              description: "Your current thinking step",
            },
            nextThoughtNeeded: {
              type: "boolean",
              description: "Whether another thought step is needed",
            },
            thoughtNumber: {
              type: "integer",
              description: "Current thought number",
              minimum: 1,
            },
            totalThoughts: {
              type: "integer",
              description: "Estimated total thoughts needed",
              minimum: 1,
            },
            isRevision: {
              type: "boolean",
              description: "Whether this revises previous thinking",
            },
            revisesThought: {
              type: "integer",
              description: "Which thought is being reconsidered",
              minimum: 1,
            },
            branchFromThought: {
              type: "integer",
              description: "Branching point thought number",
              minimum: 1,
            },
            branchId: {
              type: "string",
              description: "Branch identifier",
            },
            needsMoreThoughts: {
              type: "boolean",
              description: "If more thoughts are needed",
            },
          },
          required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"],
        },
      },
      {
        thought:
          "Understanding the requirement: The user is asking for a JavaScript implementation of the quicksort algorithm, specifically mentioning 'quicksort2'. It's unclear if 'quicksort2' refers to a variation or just a typo.",
        nextThoughtNeeded: true,
        thoughtNumber: "1",
        totalThoughts: 3,
      }
    )
    console.log(res)
  } catch (error) {
    console.log(error)
  }
}
test1()
</script>
<template>
  <div></div>
</template>
<style lang="scss" scoped></style>
