import { describe, expect, it, vi } from "vitest"

import { FetchTransport } from "./transport"

describe("FetchTransport", () => {
  it("includes credentials and query parameters", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", apiVersion: "0.2.0" }), {
        headers: { "content-type": "application/json" },
      }),
    )
    const transport = new FetchTransport({ fetcher })

    await transport.request({ path: "health", query: { limit: 20 } })

    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/health?limit=20",
      expect.objectContaining({ credentials: "include" }),
    )
  })

  it("rejects an authentication HTML response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("<html>login</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    )
    const transport = new FetchTransport({ fetcher })

    await expect(transport.request({ path: "health" })).rejects.toEqual(
      expect.objectContaining({ code: "invalid_response" }),
    )
  })

  it("serializes JSON mutation requests", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ revision: "next" }), {
        headers: { "content-type": "application/json" },
      }),
    )
    const transport = new FetchTransport({ fetcher })
    const body = {
      expectedRevision: "current",
      changes: [{ path: "Alas.Emulator.Serial", value: "auto" }],
    }

    await transport.request({ path: "instances/alas/config", method: "PATCH", body })

    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/instances/alas/config",
      expect.objectContaining({
        body: JSON.stringify(body),
        method: "PATCH",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    )
  })
})
