import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"

const baseUrl = "https://test.com"

const server = setupServer(
  http.post(baseUrl, async ({ request }) => {
    console.log("[mock post]")
    return HttpResponse.json({
      data: "ok",
      msg: "ok post",
      code: 200,
    })
  }),

  http.get(baseUrl, ({ request }) => {
    console.log("[mock post]")
    return HttpResponse.json({
      data: "ok",
      msg: "ok get",
      code: 200,
    })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
