import { Button } from "@janus/ui/components/button"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("Button", () => {
  it("renders the shadcn data slot", () => {
    const markup = renderToStaticMarkup(<Button>Save</Button>)

    expect(markup).toContain('data-slot="button"')
    expect(markup).toContain("Save")
  })
})
