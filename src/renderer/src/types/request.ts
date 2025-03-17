export interface ChatResponseHandler {
  restart: () => void
  terminate: () => void
  onData: (callback: (message: string) => void) => void
}
export interface ChatRequestHandler {
  request: (message: string) => ChatResponseHandler
}
