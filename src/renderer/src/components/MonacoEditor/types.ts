export interface EditorProps {
  filename: string
  value: string
  lang: string
  /**
   * 当`MonacoEditor`卸载时，是否删除添加的`Model`,默认:false
   */
  disposeModel?: boolean
  /**
   * 文件的命名空间,视为文件根路径,所有在同一Editor下的文件视为在同一根路径中
   */
  namespace: string
  /**
   * TODO: implement the props
   */
  readonly?: boolean
}
