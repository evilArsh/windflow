export async function* readLines(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
  try {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder
        .decode(value, { stream: true })
        .split(/\r?\n/)
        .filter(v => !!v)
      for (const line of lines) {
        yield line
      }
    }
  } catch (error) {
    yield errorToText(error)
  }
}
