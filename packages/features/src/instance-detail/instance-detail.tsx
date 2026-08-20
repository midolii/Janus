import type { JanusApiClient } from "@janus/api-client/client"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  configQueryOptions,
  configSchemaQueryOptions,
  instanceQueryOptions,
  tasksQueryOptions,
} from "../api/queries"
import { ConfigPanel } from "./components/config-panel"
import { ErrorPanel } from "./components/instance-panel-primitives"
import { LogsPanel } from "./components/logs-panel"
import { OverviewPanel } from "./components/overview-panel"
import { TasksPanel } from "./components/tasks-panel"
import { useInstanceMutations } from "./hooks/use-instance-mutations"
import type { InstanceDetailTab } from "./instance-detail-tabs"

export interface InstanceDetailProps {
  api: JanusApiClient
  instance: string
  activeTab: InstanceDetailTab
}

/** Coordinates data dependencies and delegates each routed tab to a focused panel component. */
export function InstanceDetail({ api, instance, activeTab }: InstanceDetailProps) {
  const reduceMotion = useReducedMotion()
  const mutations = useInstanceMutations(api, instance)
  const instanceQuery = useQuery(instanceQueryOptions(api, instance))
  const tasks = useQuery({
    ...tasksQueryOptions(api, instance),
    enabled: activeTab === "overview" || activeTab === "tasks",
  })
  const config = useQuery({
    ...configQueryOptions(api, instance),
    enabled: activeTab === "config",
  })
  const configSchema = useQuery({
    ...configSchemaQueryOptions(api, instance),
    enabled: activeTab === "config",
  })

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[rgba(248,251,252,0.34)]">
      <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4 lg:p-8">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${instance}:${activeTab}`}
            className="h-full min-h-0"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -5 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {instanceQuery.isError ? (
              <ErrorPanel title="实例读取失败" detail={instanceQuery.error.message} />
            ) : null}
            {activeTab === "overview" ? (
              <OverviewPanel
                instanceData={instanceQuery.data}
                instancePending={instanceQuery.isPending}
                tasks={tasks.data}
                tasksPending={tasks.isPending}
              />
            ) : null}
            {activeTab === "tasks" ? (
              <TasksPanel
                data={tasks.data}
                pending={tasks.isPending}
                error={tasks.error}
                runningTaskName={
                  mutations.taskMutation.isPending
                    ? (mutations.taskMutation.variables ?? null)
                    : null
                }
                actionError={mutations.taskMutation.error}
                onRunNow={(task) => mutations.taskMutation.mutate(task)}
              />
            ) : null}
            {activeTab === "config" ? (
              <ConfigPanel
                config={config.data}
                schema={configSchema.data}
                pending={config.isPending || configSchema.isPending}
                error={config.error ?? configSchema.error}
                saveError={mutations.configMutation.error}
                onSave={(request) => mutations.configMutation.mutateAsync(request)}
              />
            ) : null}
            {activeTab === "logs" ? <LogsPanel api={api} instance={instance} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
