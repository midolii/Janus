import { InstanceNavigation } from "@janus/ui/components/instance-navigation"
import { Info, Settings2 } from "lucide-react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("InstanceNavigation", () => {
  it("renders the same controlled state for compact and desktop navigation", () => {
    const markup = renderToStaticMarkup(
      <InstanceNavigation
        instances={[{ name: "alas", running: true }]}
        tabs={[
          { id: "overview", label: "概览", icon: Info },
          { id: "config", label: "配置", icon: Settings2 },
        ]}
        dashboardActive={false}
        activeInstance="alas"
        activeTab="config"
        expandedInstance="alas"
        onSelectDashboard={() => undefined}
        onSelectInstance={() => undefined}
        onSelectTab={() => undefined}
      />,
    )

    expect(markup).toContain("实例：alas")
    expect(markup.match(/role="tablist"/g)).toHaveLength(2)
    expect(markup.match(/aria-selected="true"/g)).toHaveLength(2)
  })
})
