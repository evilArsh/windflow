export interface ToolEnvironment {
  npm: {
    registry: string
    mirrors: Array<{ label: string; value: string }>
  }
  uv: {
    path: string
    status?: boolean
    version?: string
  }
  bun: {
    path: string
    status?: boolean
    version?: string
  }
  [x: string]: any
}

export interface ToolTestParam {
  status: boolean
  msg?: string
}

export interface ToolEnvTestResult {
  uv: ToolTestParam
  bun: ToolTestParam
}
