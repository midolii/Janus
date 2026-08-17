import { TanStackDevtools } from "@tanstack/react-devtools"
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TableDevtoolsPanel } from "@tanstack/react-table-devtools"

export default function DevelopmentTools() {
  return (
    <TanStackDevtools
      config={{
        hideUntilHover: true,
        position: "bottom-right",
      }}
      plugins={[
        {
          id: "query",
          name: "TanStack Query",
          render: <ReactQueryDevtoolsPanel />,
        },
        {
          id: "router",
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel />,
        },
        {
          id: "form",
          name: "TanStack Form",
          render: (_element, props) => <FormDevtoolsPanel {...props} />,
        },
        {
          id: "table",
          name: "TanStack Table",
          render: <TableDevtoolsPanel />,
        },
      ]}
    />
  )
}
