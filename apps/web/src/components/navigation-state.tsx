import { createContext, type ReactNode, use, useMemo, useState } from "react"

interface NavigationStateValue {
  expandedInstance: string | null
  setExpandedInstance: (instance: string | null) => void
}

const NavigationStateContext = createContext<NavigationStateValue | null>(null)

/**
 * Keeps navigation disclosure state above route leaves, so moving between the dashboard and an
 * instance route does not recreate it. Route selection remains the router's responsibility.
 */
export function NavigationStateProvider({ children }: { children: ReactNode }) {
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null)
  const value = useMemo(() => ({ expandedInstance, setExpandedInstance }), [expandedInstance])

  return <NavigationStateContext value={value}>{children}</NavigationStateContext>
}

export function useNavigationState(): NavigationStateValue {
  const value = use(NavigationStateContext)
  if (!value) {
    throw new Error("useNavigationState must be used within NavigationStateProvider")
  }

  return value
}
