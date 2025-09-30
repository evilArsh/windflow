import * as arrow from "apache-arrow"

export function combineTableName(topicId: string): string {
  return `lance_table_${topicId}`
}

/**
 * create schema with type `RAGFile` and specify the vector dimensions
 */
export function createTableSchema(dimensions: number) {
  return new arrow.Schema([
    new arrow.Field("id", new arrow.Utf8(), false),
    new arrow.Field(
      "vector",
      new arrow.FixedSizeList(dimensions, new arrow.Field("item", new arrow.Float32(), false)),
      false
    ),
    new arrow.Field("fileId", new arrow.Utf8(), false),
    new arrow.Field("configId", new arrow.Utf8(), false),
    new arrow.Field("topicId", new arrow.Utf8(), true),
    new arrow.Field("content", new arrow.Utf8(), false),
    new arrow.Field("fileName", new arrow.Utf8(), false),
    new arrow.Field("fileSize", new arrow.Uint32(), false),
    new arrow.Field("mimeType", new arrow.Utf8(), true),
    new arrow.Field("chunkIndex", new arrow.Int32(), false),
    new arrow.Field("tokens", new arrow.Uint32(), true),
  ])
}
