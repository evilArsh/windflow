import { TableProps } from "element-plus"

export type DefaultRow = Record<PropertyKey, any>

export type CombineTableProps = Partial<TableProps<DefaultRow>> & {
  allowDragLastColumn?: boolean
  preserveExpandedContent?: boolean
}
