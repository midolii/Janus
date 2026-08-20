import type { JanusApiClient } from "@janus/api-client/client"
import type { ConfigPatchRequest } from "@janus/api-client/contracts"
import { ApiError } from "@janus/api-client/transport"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../../api/queries"

export function useInstanceMutations(api: JanusApiClient, instance: string) {
  const queryClient = useQueryClient()

  const configMutation = useMutation({
    mutationFn: (request: ConfigPatchRequest) => api.updateConfig(instance, request),
    onSuccess: (config) => {
      queryClient.setQueryData(queryKeys.config(instance), config)
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(instance) })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "config_revision_conflict") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.config(instance) })
      }
    },
  })

  const taskMutation = useMutation({
    mutationFn: (task: string) => api.runTaskNow(instance, task),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(instance) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.config(instance) })
    },
  })

  return {
    configMutation,
    taskMutation,
  }
}
